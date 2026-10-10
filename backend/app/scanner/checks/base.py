import time
from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import httpx


class CheckStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    SKIPPED = "skipped"
    ERROR = "error"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


@dataclass
class FindingDraft:
    rule_id: str
    title: str
    description: str
    severity: Severity
    category: str
    affected_component: str
    risk_explanation: str
    remediation: str
    confidence: str = "high"  # high, medium, low
    evidence: Dict[str, Any] = field(default_factory=dict)
    references: List[str] = field(default_factory=list)
    cwe_id: Optional[str] = None


@dataclass
class CheckResult:
    check_id: str
    check_name: str
    category: str
    status: CheckStatus
    execution_time_ms: float = 0.0
    details: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    findings: List[FindingDraft] = field(default_factory=list)


@dataclass
class ScanContext:
    target_url: str
    hostname: str
    port: int
    resolved_ip: str
    timeout_seconds: int = 15
    http_client: Optional[httpx.AsyncClient] = None
    cached_responses: Dict[str, Any] = field(default_factory=dict)
    allow_local: bool = False
    cancelled: bool = False


class BaseCheck:
    check_id: str = "BASE-000"
    name: str = "Base Security Check"
    category: str = "General"
    description: str = ""
    default_severity: Severity = Severity.INFORMATIONAL
    profiles: List[str] = ["quick", "standard"]
    is_network_check: bool = True

    async def execute(self, ctx: ScanContext) -> CheckResult:
        start_time = time.perf_counter()
        try:
            result = await self.run_check(ctx)
            result.execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return result
        except Exception as e:
            elapsed = round((time.perf_counter() - start_time) * 1000, 2)
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.ERROR,
                execution_time_ms=elapsed,
                error_message=f"Check failed with unexpected error: {str(e)}",
                details={"exception": type(e).__name__, "message": str(e)}
            )

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        raise NotImplementedError
