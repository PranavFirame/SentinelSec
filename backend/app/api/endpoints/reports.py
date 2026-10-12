from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.auth import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.scan import Scan
from backend.app.schemas.report import JSONReport
from backend.app.schemas.scan import ScanResponse, FindingSummary
from backend.app.schemas.finding import FindingResponse
from backend.app.schemas.check import CheckExecutionResponse

router = APIRouter()


@router.get("/{scan_id}/json", response_model=JSONReport)
def get_scan_report_json(
    scan_id: str,
    download: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads or views scan report, strictly checking scan ownership by the authenticated user.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    findings_summary = FindingSummary()
    for f in scan.findings:
        sev = f.severity.lower()
        if hasattr(findings_summary, sev):
            setattr(findings_summary, sev, getattr(findings_summary, sev) + 1)
    findings_summary.total = len(scan.findings)

    scan_resp = ScanResponse.model_validate(scan)
    scan_resp.findings_summary = findings_summary

    findings = [FindingResponse.model_validate(f) for f in scan.findings]
    check_execs = [CheckExecutionResponse.model_validate(c) for c in scan.check_executions]

    report = JSONReport(
        schema_version="1.0.0",
        scanner_name=settings.PROJECT_NAME,
        scanner_version=settings.VERSION,
        generated_at=datetime.now(timezone.utc),
        scan=scan_resp,
        score_breakdown=scan.score_breakdown,
        findings=findings,
        check_executions=check_execs
    )

    if download:
        filename = f"sentinelsec-report-{scan.id[:8]}.json"
        content = report.model_dump_json(indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    return report
