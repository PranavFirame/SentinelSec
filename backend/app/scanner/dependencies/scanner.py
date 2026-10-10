import time
from typing import List, Dict, Any, Optional
from backend.app.scanner.dependencies.parser import parse_manifest, DependencyItem
from backend.app.scanner.dependencies.osv_client import OSVAdvisoryProvider, VulnerabilityAdvisory
from backend.app.scanner.checks.base import FindingDraft, Severity, CheckResult, CheckStatus
from backend.app.scanner.risk import calculate_security_score


class DependencyScanResult:
    def __init__(
        self,
        filename: str,
        total_dependencies: int,
        unpinned_dependencies: int,
        vulnerabilities_found: int,
        findings: List[FindingDraft],
        dependencies: List[Dict[str, Any]],
        score_data: Dict[str, Any],
        duration_seconds: float
    ):
        self.filename = filename
        self.total_dependencies = total_dependencies
        self.unpinned_dependencies = unpinned_dependencies
        self.vulnerabilities_found = vulnerabilities_found
        self.findings = findings
        self.dependencies = dependencies
        self.score_data = score_data
        self.duration_seconds = duration_seconds


class DependencyScanner:
    def __init__(self, provider: Optional[OSVAdvisoryProvider] = None):
        self.provider = provider or OSVAdvisoryProvider()

    async def scan_manifest(self, filename: str, content: str) -> DependencyScanResult:
        start_time = time.perf_counter()
        items = parse_manifest(filename, content)
        advisories_map = await self.provider.query_dependencies(items)

        findings: List[FindingDraft] = []
        deps_summary: List[Dict[str, Any]] = []
        unpinned_count = 0

        for item in items:
            item_advisories = advisories_map.get(item.name, [])
            if not item.is_exact:
                unpinned_count += 1

            deps_summary.append({
                "name": item.name,
                "version": item.version,
                "ecosystem": item.ecosystem,
                "is_exact": item.is_exact,
                "advisories_count": len(item_advisories)
            })

            for adv in item_advisories:
                # Map advisory severity string to Severity enum
                sev_enum = Severity.MEDIUM
                s_lower = adv.severity.lower()
                if s_lower == "critical":
                    sev_enum = Severity.CRITICAL
                elif s_lower == "high":
                    sev_enum = Severity.HIGH
                elif s_lower == "low":
                    sev_enum = Severity.LOW
                elif s_lower == "informational":
                    sev_enum = Severity.INFORMATIONAL

                # Identify primary CVE alias if available
                cve_alias = next((a for a in adv.aliases if a.startswith("CVE-")), None)
                rule_id = cve_alias or adv.vuln_id

                fix_text = f"Upgrade '{item.name}' to version {', '.join(adv.fixed_versions)}." if adv.fixed_versions else f"Review updates for '{item.name}'."

                findings.append(
                    FindingDraft(
                        rule_id=rule_id,
                        title=f"{rule_id}: {adv.summary[:80]}",
                        description=adv.details or adv.summary,
                        severity=sev_enum,
                        category="Dependency Vulnerability",
                        confidence="high",
                        affected_component=f"{item.name}@{item.version} ({item.ecosystem})",
                        evidence={
                            "package": item.name,
                            "installed_version": item.version,
                            "ecosystem": item.ecosystem,
                            "vuln_id": adv.vuln_id,
                            "aliases": adv.aliases,
                            "fixed_versions": adv.fixed_versions,
                            "cvss_score": adv.cvss_score
                        },
                        risk_explanation=(
                            f"A known publicly documented security advisory exists for {item.name}@{item.version}. "
                            "Adversaries can exploit known weaknesses if the vulnerable library functions are reachable."
                        ),
                        remediation=fix_text,
                        references=adv.references,
                        cwe_id="CWE-1395"
                    )
                )

        score_data = calculate_security_score(findings)
        elapsed = round(time.perf_counter() - start_time, 2)

        return DependencyScanResult(
            filename=filename,
            total_dependencies=len(items),
            unpinned_dependencies=unpinned_count,
            vulnerabilities_found=len(findings),
            findings=findings,
            dependencies=deps_summary,
            score_data=score_data,
            duration_seconds=elapsed
        )
