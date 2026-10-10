from typing import List, Dict, Any, Union
from collections import defaultdict
from backend.app.scanner.checks.base import Severity, FindingDraft
from backend.app.models.finding import Finding


SEVERITY_BASE_PENALTIES = {
    Severity.CRITICAL.value: 25.0,
    Severity.HIGH.value: 15.0,
    Severity.MEDIUM.value: 8.0,
    Severity.LOW.value: 3.0,
    Severity.INFORMATIONAL.value: 0.0,
}

CONFIDENCE_MULTIPLIERS = {
    "high": 1.0,
    "medium": 0.8,
    "low": 0.5,
}


def calculate_security_score(findings: List[Union[FindingDraft, Finding, Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Deterministic risk scoring engine.
    Computes a score from 0 to 100 based on findings, severity weights,
    confidence multipliers, and diminishing penalties for duplicated root causes.
    """
    base_score = 100.0
    deductions: List[Dict[str, Any]] = []
    severity_totals = defaultdict(float)
    rule_counts = defaultdict(int)

    for item in findings:
        if isinstance(item, FindingDraft):
            rule_id = item.rule_id
            title = item.title
            sev = item.severity.value if isinstance(item.severity, Severity) else str(item.severity).lower()
            conf = (item.confidence or "high").lower()
        elif isinstance(item, Finding):
            rule_id = item.rule_id
            title = item.title
            sev = item.severity.lower()
            conf = (item.confidence or "high").lower()
        else:
            rule_id = item.get("rule_id", "UNKNOWN")
            title = item.get("title", "Finding")
            sev = str(item.get("severity", "medium")).lower()
            conf = str(item.get("confidence", "high")).lower()

        base_penalty = SEVERITY_BASE_PENALTIES.get(sev, 5.0)
        conf_multiplier = CONFIDENCE_MULTIPLIERS.get(conf, 1.0)

        # Deduplication / diminishing returns for multiple instances of same root rule
        count = rule_counts[rule_id]
        if count == 0:
            instance_multiplier = 1.0
        elif count == 1:
            instance_multiplier = 0.35
        elif count == 2:
            instance_multiplier = 0.15
        else:
            instance_multiplier = 0.05  # capped diminishing weight

        rule_counts[rule_id] += 1
        penalty = round(base_penalty * conf_multiplier * instance_multiplier, 2)

        if penalty > 0:
            deductions.append({
                "rule_id": rule_id,
                "title": title,
                "severity": sev,
                "confidence": conf,
                "occurrence": count + 1,
                "penalty": penalty
            })
            severity_totals[sev] += penalty

    total_penalty = round(sum(d["penalty"] for d in deductions), 2)
    final_score = int(max(0, min(100, round(base_score - total_penalty))))

    return {
        "final_score": final_score,
        "base_score": 100,
        "total_penalty": total_penalty,
        "severity_penalties": {
            "critical": round(severity_totals["critical"], 2),
            "high": round(severity_totals["high"], 2),
            "medium": round(severity_totals["medium"], 2),
            "low": round(severity_totals["low"], 2),
        },
        "total_findings_evaluated": len(findings),
        "unique_rules_evaluated": len(rule_counts),
        "deductions": deductions,
        "rating": (
            "A (Optimal)" if final_score >= 90 else
            "B (Good)" if final_score >= 80 else
            "C (Moderate Risk)" if final_score >= 65 else
            "D (High Risk)" if final_score >= 45 else
            "F (Critical Risk)"
        ),
        "methodology": "Score is derived from 100 baseline minus severity-weighted penalties with duplicate dampening. 100 reflects passing the configured non-destructive automated checks only."
    }
