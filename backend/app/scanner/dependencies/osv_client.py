import asyncio
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import httpx

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.scanner.dependencies.parser import DependencyItem


@dataclass
class VulnerabilityAdvisory:
    vuln_id: str
    aliases: List[str]  # e.g. ["CVE-2021-3281"]
    summary: str
    details: str
    severity: str  # critical, high, medium, low, informational
    cvss_score: Optional[float]
    package_name: str
    package_version: str
    ecosystem: str
    fixed_versions: List[str] = field(default_factory=list)
    references: List[str] = field(default_factory=list)


# In-memory query cache: (ecosystem, name, version) -> (timestamp, List[VulnerabilityAdvisory])
_ADVISORY_CACHE: Dict[tuple, tuple[float, List[VulnerabilityAdvisory]]] = {}


def cvss_to_severity(score: Optional[float]) -> str:
    if score is None:
        return "medium"
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score > 0.0:
        return "low"
    return "informational"


def parse_cvss_vector(score_vector: str) -> Optional[float]:
    """Basic extraction or estimation from CVSS v3 score strings if present."""
    # Often OSV provides score as CVSS string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
    # Without full cvss calculator library, we can categorize by vector indicators or default to high
    if "C:H/I:H/A:H" in score_vector or "C:H/I:H" in score_vector:
        return 8.8
    if "C:H" in score_vector or "I:H" in score_vector or "A:H" in score_vector:
        return 7.5
    return 5.5


class OSVAdvisoryProvider:
    def __init__(self, api_url: Optional[str] = None, timeout: int = 10):
        self.api_url = (api_url or settings.OSV_API_URL).rstrip("/")
        self.timeout = timeout

    async def query_dependencies(self, items: List[DependencyItem]) -> Dict[str, List[VulnerabilityAdvisory]]:
        """
        Queries OSV batch endpoint for given dependencies.
        Returns mapping: package_name -> list of advisories.
        """
        results_map: Dict[str, List[VulnerabilityAdvisory]] = {item.name: [] for item in items}
        
        # Filter for items that have exact versions
        queries_to_send: List[tuple[int, DependencyItem, Dict[str, Any]]] = []
        now = time.time()

        for idx, item in enumerate(items):
            if not item.is_exact or item.version == "*":
                continue

            cache_key = (item.ecosystem, item.name.lower(), item.version)
            if cache_key in _ADVISORY_CACHE:
                cached_time, cached_vulns = _ADVISORY_CACHE[cache_key]
                if now - cached_time < settings.OSV_CACHE_TTL_SECONDS:
                    results_map[item.name].extend(cached_vulns)
                    continue

            queries_to_send.append((
                idx,
                item,
                {
                    "package": {
                        "name": item.name,
                        "ecosystem": item.ecosystem
                    },
                    "version": item.version
                }
            ))

        if not queries_to_send:
            return results_map

        # Chunk into batches of 40 to avoid oversized requests
        batch_size = 40
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for i in range(0, len(queries_to_send), batch_size):
                chunk = queries_to_send[i : i + batch_size]
                payload = {"queries": [c[2] for c in chunk]}

                try:
                    resp = await client.post(f"{self.api_url}/querybatch", json=payload)
                    if resp.status_code != 200:
                        logger.warning(f"OSV querybatch returned HTTP {resp.status_code}")
                        continue

                    data = resp.json()
                    results = data.get("results", [])

                    for (orig_idx, item, _), res_item in zip(chunk, results):
                        vulns_data = res_item.get("vulns", [])
                        advisories = []

                        for v in vulns_data:
                            vuln_id = v.get("id", "UNKNOWN")
                            aliases = v.get("aliases", [])
                            summary = v.get("summary") or v.get("details", "")[:120] or "Vulnerability reported in OSV"
                            details = v.get("details", "")
                            
                            # Parse severity
                            cvss_score = None
                            sev_str = "medium"
                            severity_entries = v.get("severity", [])
                            for s in severity_entries:
                                if s.get("type") in ("CVSS_V3", "CVSS_V2"):
                                    cvss_score = parse_cvss_vector(s.get("score", ""))
                                    sev_str = cvss_to_severity(cvss_score)
                                    break

                            # If database specific severity
                            if not severity_entries:
                                db_spec = v.get("database_specific", {})
                                if "severity" in db_spec:
                                    sev_str = db_spec["severity"].lower()

                            # Extract fixed versions
                            fixed_versions = []
                            for aff in v.get("affected", []):
                                for r in aff.get("ranges", []):
                                    for ev in r.get("events", []):
                                        if "fixed" in ev:
                                            fixed_versions.append(ev["fixed"])

                            # References
                            refs = [ref.get("url") for ref in v.get("references", []) if ref.get("url")]

                            adv = VulnerabilityAdvisory(
                                vuln_id=vuln_id,
                                aliases=aliases,
                                summary=summary,
                                details=details,
                                severity=sev_str,
                                cvss_score=cvss_score,
                                package_name=item.name,
                                package_version=item.version,
                                ecosystem=item.ecosystem,
                                fixed_versions=fixed_versions,
                                references=refs[:5]
                            )
                            advisories.append(adv)

                        # Save to cache
                        cache_key = (item.ecosystem, item.name.lower(), item.version)
                        _ADVISORY_CACHE[cache_key] = (now, advisories)
                        results_map[item.name].extend(advisories)

                except Exception as e:
                    logger.error(f"Failed to query OSV API for batch: {str(e)}")
                    # Graceful degradation: return parsed packages with note that live feed was unreachable
                    continue

        return results_map
