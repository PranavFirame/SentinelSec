from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.schemas.scan import ScanComparisonResult


def compare_scans(db: Session, scan_a_id: str, scan_b_id: str, owner_id: Optional[str] = None) -> ScanComparisonResult:
    query_a = db.query(Scan).filter(Scan.id == scan_a_id)
    query_b = db.query(Scan).filter(Scan.id == scan_b_id)
    
    if owner_id:
        query_a = query_a.filter(Scan.owner_id == owner_id)
        query_b = query_b.filter(Scan.owner_id == owner_id)

    scan_a = query_a.first()
    scan_b = query_b.first()

    if not scan_a or not scan_b:
        raise ValueError("One or both scans specified for comparison do not exist.")

    # Build key: (rule_id, affected_component)
    def make_finding_dict(f: Finding) -> Dict[str, Any]:
        return {
            "id": f.id,
            "rule_id": f.rule_id,
            "title": f.title,
            "severity": f.severity,
            "category": f.category,
            "affected_component": f.affected_component,
            "status": f.status,
            "cwe_id": f.cwe_id,
        }

    findings_a = { (f.rule_id, f.affected_component): make_finding_dict(f) for f in scan_a.findings }
    findings_b = { (f.rule_id, f.affected_component): make_finding_dict(f) for f in scan_b.findings }

    new_findings: List[Dict[str, Any]] = []
    resolved_findings: List[Dict[str, Any]] = []
    recurring_findings: List[Dict[str, Any]] = []

    # New findings: in B but not in A
    for key, f_dict in findings_b.items():
        if key not in findings_a:
            new_findings.append(f_dict)
        else:
            recurring_findings.append(f_dict)

    # Resolved findings: in A but not in B
    for key, f_dict in findings_a.items():
        if key not in findings_b:
            resolved_findings.append(f_dict)

    score_delta = None
    if scan_b.security_score is not None and scan_a.security_score is not None:
        score_delta = scan_b.security_score - scan_a.security_score

    return ScanComparisonResult(
        scan_a_id=scan_a.id,
        scan_b_id=scan_b.id,
        scan_a_target=scan_a.target,
        scan_b_target=scan_b.target,
        scan_a_date=scan_a.created_at,
        scan_b_date=scan_b.created_at,
        scan_a_score=scan_a.security_score,
        scan_b_score=scan_b.security_score,
        score_delta=score_delta,
        new_findings=new_findings,
        resolved_findings=resolved_findings,
        recurring_findings=recurring_findings
    )
