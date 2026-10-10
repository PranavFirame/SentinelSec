import asyncio
import time
from typing import List, Callable, Optional, Dict, Any
from urllib.parse import urlparse
import httpx

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.scanner.safety.ssrf import validate_target_url, SSRFValidationError
from backend.app.scanner.safety.redaction import sanitize_evidence
from backend.app.scanner.checks.base import (
    BaseCheck,
    CheckResult,
    CheckStatus,
    ScanContext,
    FindingDraft
)
from backend.app.scanner.checks.registry import get_checks_for_profile, CHECK_REGISTRY
from backend.app.scanner.risk import calculate_security_score


class ScannerExecutionResult:
    def __init__(
        self,
        target_url: str,
        resolved_ip: str,
        check_results: List[CheckResult],
        all_findings: List[FindingDraft],
        score_data: Dict[str, Any],
        duration_seconds: float,
        error_summary: Optional[str] = None
    ):
        self.target_url = target_url
        self.resolved_ip = resolved_ip
        self.check_results = check_results
        self.all_findings = all_findings
        self.score_data = score_data
        self.duration_seconds = duration_seconds
        self.error_summary = error_summary


class SecurityScanEngine:
    def __init__(self, allow_local: Optional[bool] = None):
        self.allow_local = allow_local if allow_local is not None else settings.ALLOW_LOCAL_TARGETS

    async def execute_scan(
        self,
        target: str,
        profile: str = "standard",
        enabled_checks: Optional[List[str]] = None,
        timeout_seconds: int = 15,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        is_cancelled: Optional[Callable[[], bool]] = None
    ) -> ScannerExecutionResult:
        """
        Executes a security scan against target.
        """
        start_time = time.perf_counter()

        # 1. SSRF Validation
        normalized_url, resolved_ip, port = validate_target_url(target, allow_local=self.allow_local)
        parsed = urlparse(normalized_url)
        hostname = parsed.hostname or ""

        # 2. Select checks
        if enabled_checks:
            checks: List[BaseCheck] = []
            for cid in enabled_checks:
                if cid in CHECK_REGISTRY:
                    checks.append(CHECK_REGISTRY[cid]())
        else:
            checks = get_checks_for_profile(profile)

        total_checks = len(checks)
        check_results: List[CheckResult] = []
        all_findings: List[FindingDraft] = []

        # Configure custom safe HTTP client
        headers = {
            "User-Agent": "SentinelSec-SecurityScanner/1.0 (Defensive Vulnerability Assessment Engine; +https://github.com/sentinelsec/scanner)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        # Limits to prevent resource exhaustion
        limits = httpx.Limits(max_connections=5, max_keepalive_connections=2)
        transport = httpx.AsyncHTTPTransport(retries=1, verify=False)  # We inspect certs manually in TLS checks

        async with httpx.AsyncClient(
            headers=headers,
            limits=limits,
            transport=transport,
            verify=False,
            timeout=httpx.Timeout(timeout_seconds, connect=min(timeout_seconds, 8))
        ) as client:
            ctx = ScanContext(
                target_url=normalized_url,
                hostname=hostname,
                port=port,
                resolved_ip=resolved_ip,
                timeout_seconds=timeout_seconds,
                http_client=client,
                allow_local=self.allow_local
            )

            for idx, check in enumerate(checks):
                # Cooperative cancellation check
                if is_cancelled and is_cancelled():
                    ctx.cancelled = True
                    break

                if progress_callback:
                    try:
                        progress_callback(idx, total_checks, check.name)
                    except Exception:
                        pass

                logger.info(f"Running check {check.check_id} ({check.name}) against {hostname}")
                res = await check.execute(ctx)
                
                # Sanitize details and findings
                res.details = sanitize_evidence(res.details)
                for f in res.findings:
                    f.evidence = sanitize_evidence(f.evidence)

                check_results.append(res)
                all_findings.extend(res.findings)

        if progress_callback and not (is_cancelled and is_cancelled()):
            try:
                progress_callback(total_checks, total_checks, "Complete")
            except Exception:
                pass

        elapsed = round(time.perf_counter() - start_time, 2)
        score_data = calculate_security_score(all_findings)

        return ScannerExecutionResult(
            target_url=normalized_url,
            resolved_ip=resolved_ip,
            check_results=check_results,
            all_findings=all_findings,
            score_data=score_data,
            duration_seconds=elapsed,
            error_summary="Scan cancelled by user." if ctx.cancelled else None
        )
