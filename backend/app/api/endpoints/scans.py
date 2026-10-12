from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.auth import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.schemas.scan import (
    ScanCreate,
    ScanResponse,
    ScanProgress,
    ScanComparisonResult,
    FindingSummary
)
from backend.app.schemas.finding import FindingResponse
from backend.app.schemas.check import CheckDefinition
from backend.app.scanner.safety.ssrf import validate_target_url, SSRFValidationError
from backend.app.scanner.checks.registry import get_check_definitions
from backend.app.services.scan_manager import scan_manager
from backend.app.services.comparison import compare_scans
from backend.app.scanner.dependencies.scanner import DependencyScanner

router = APIRouter()


def build_findings_summary(scan: Scan) -> FindingSummary:
    summary = FindingSummary()
    for f in scan.findings:
        sev = f.severity.lower()
        if sev == "critical":
            summary.critical += 1
        elif sev == "high":
            summary.high += 1
        elif sev == "medium":
            summary.medium += 1
        elif sev == "low":
            summary.low += 1
        elif sev == "informational":
            summary.informational += 1
    summary.total = len(scan.findings)
    return summary


@router.get("/checks/available", response_model=List[CheckDefinition])
def list_available_checks():
    """Returns the full list of security checks supported by the scanner engine."""
    return get_check_definitions()


@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    payload: ScanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates target URL and initiates scan owned by the authenticated user.
    """
    try:
        normalized_url, resolved_ip, port = validate_target_url(payload.target)
    except SSRFValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target URL rejected by SSRF and policy enforcement: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target validation failed: {str(e)}"
        )

    # Associate new scan directly with the authenticated user
    new_scan = Scan(
        target=normalized_url,
        profile=payload.profile,
        status="queued",
        target_ip=resolved_ip,
        owner_id=current_user.id
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    # Launch background scan job
    await scan_manager.start_scan_job(
        scan_id=new_scan.id,
        target=normalized_url,
        profile=payload.profile,
        enabled_checks=payload.enabled_checks,
        timeout_seconds=payload.timeout_seconds or 15
    )

    resp = ScanResponse.model_validate(new_scan)
    resp.findings_summary = build_findings_summary(new_scan)
    return resp


@router.get("", response_model=List[ScanResponse])
def list_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    profile: Optional[str] = None,
    target_search: Optional[str] = Query(None, alias="q"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists only scans owned by the currently authenticated user.
    """
    query = db.query(Scan).filter(Scan.owner_id == current_user.id)
    if status_filter:
        query = query.filter(Scan.status == status_filter)
    if profile:
        query = query.filter(Scan.profile == profile)
    if target_search:
        query = query.filter(Scan.target.ilike(f"%{target_search}%"))

    scans = query.order_by(desc(Scan.created_at)).offset(skip).limit(limit).all()
    results = []
    for s in scans:
        r = ScanResponse.model_validate(s)
        r.findings_summary = build_findings_summary(s)
        results.append(r)
    return results


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves scan details, enforcing that it belongs to the authenticated user.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")
    
    resp = ScanResponse.model_validate(scan)
    resp.findings_summary = build_findings_summary(scan)
    return resp


@router.get("/{scan_id}/progress", response_model=ScanProgress)
def get_scan_progress(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves live scan progress for a scan owned by the authenticated user.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    if scan.status in ("completed", "failed", "cancelled"):
        return ScanProgress(
            scan_id=scan.id,
            status=scan.status,
            checks_executed=scan.checks_executed,
            checks_total=scan.checks_executed,
            percent_complete=100,
            current_check="Finished",
            duration_seconds=scan.duration_seconds
        )

    live = scan_manager.get_progress(scan_id)
    if live:
        return ScanProgress(
            scan_id=scan.id,
            status=scan.status,
            checks_executed=live.get("checks_executed", 0),
            checks_total=live.get("checks_total", 16),
            percent_complete=live.get("percent_complete", 0),
            current_check=live.get("current_check", "Initializing checks...")
        )

    return ScanProgress(
        scan_id=scan.id,
        status=scan.status,
        checks_executed=0,
        checks_total=16,
        percent_complete=5 if scan.status == "running" else 0,
        current_check="Preparing probe environment..."
    )


@router.get("/{scan_id}/findings", response_model=List[FindingResponse])
def get_scan_findings(
    scan_id: str,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves security findings for a scan owned by the authenticated user.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    query = db.query(Finding).filter(Finding.scan_id == scan_id)
    if severity:
        query = query.filter(Finding.severity == severity.lower())
    if category:
        query = query.filter(Finding.category == category)
    if status_filter:
        query = query.filter(Finding.status == status_filter)
    if search:
        query = query.filter(
            (Finding.title.ilike(f"%{search}%")) |
            (Finding.rule_id.ilike(f"%{search}%")) |
            (Finding.description.ilike(f"%{search}%"))
        )

    findings = query.offset(skip).limit(limit).all()
    return [FindingResponse.model_validate(f) for f in findings]


@router.post("/{scan_id}/cancel")
def cancel_scan(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancels an active scan owned by the authenticated user.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    if scan.status in ("completed", "failed", "cancelled"):
        return {"message": f"Scan is already in terminal state '{scan.status}'.", "status": scan.status}

    scan_manager.cancel_scan(scan_id)
    scan.status = "cancelled"
    db.commit()
    return {"message": "Scan cancellation requested.", "status": "cancelled"}


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a scan owned by the authenticated user.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    db.delete(scan)
    db.commit()
    return None


@router.post("/{scan_id}/compare/{other_scan_id}", response_model=ScanComparisonResult)
def compare_two_scans(
    scan_id: str,
    other_scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compares two scans, verifying both belong to the authenticated user.
    """
    try:
        return compare_scans(db, scan_id, other_scan_id, owner_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Comparison error: {str(e)}")


@router.post("/dependencies/scan")
async def scan_dependency_manifest(
    file: Optional[UploadFile] = File(None),
    raw_content: Optional[str] = Form(None),
    filename: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Scans a dependency manifest and associates the record with the authenticated user.
    """
    if file:
        content_bytes = await file.read()
        content_str = content_bytes.decode("utf-8", errors="replace")
        fname = file.filename or "package-lock.json"
    elif raw_content:
        content_str = raw_content
        fname = filename or "requirements.txt"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide either file or raw_content.")

    scanner = DependencyScanner()
    res = await scanner.scan_manifest(fname, content_str)

    dep_scan = Scan(
        target=f"manifest:{fname}",
        profile="dependency",
        status="completed",
        security_score=res.score_data["final_score"],
        score_breakdown=res.score_data,
        checks_executed=res.total_dependencies,
        checks_passed=res.total_dependencies - res.vulnerabilities_found,
        checks_failed=res.vulnerabilities_found,
        duration_seconds=res.duration_seconds,
        owner_id=current_user.id
    )
    db.add(dep_scan)
    db.flush()

    for f_draft in res.findings:
        finding = Finding(
            scan_id=dep_scan.id,
            rule_id=f_draft.rule_id,
            title=f_draft.title,
            description=f_draft.description,
            severity=f_draft.severity.value,
            category=f_draft.category,
            confidence=f_draft.confidence,
            status="open",
            affected_component=f_draft.affected_component,
            evidence=f_draft.evidence,
            risk_explanation=f_draft.risk_explanation,
            remediation=f_draft.remediation,
            references=f_draft.references,
            cwe_id=f_draft.cwe_id,
            first_observed_at=dep_scan.created_at,
            last_observed_at=dep_scan.created_at
        )
        db.add(finding)

    db.commit()

    return {
        "scan_id": dep_scan.id,
        "filename": res.filename,
        "total_dependencies": res.total_dependencies,
        "unpinned_dependencies": res.unpinned_dependencies,
        "vulnerabilities_found": res.vulnerabilities_found,
        "security_score": res.score_data["final_score"],
        "score_breakdown": res.score_data,
        "dependencies": res.dependencies,
        "findings": [
            {
                "rule_id": f.rule_id,
                "title": f.title,
                "severity": f.severity.value,
                "affected_component": f.affected_component,
                "remediation": f.remediation,
                "cwe_id": f.cwe_id,
                "evidence": f.evidence
            }
            for f in res.findings
        ]
    }
