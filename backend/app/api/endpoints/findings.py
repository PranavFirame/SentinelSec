from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.core.auth import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.schemas.finding import FindingResponse, FindingUpdate

router = APIRouter()


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(
    finding_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves a finding, verifying that the parent scan belongs to the authenticated user.
    """
    finding = (
        db.query(Finding)
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Finding.id == finding_id, Scan.owner_id == current_user.id)
        .first()
    )
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")
    return FindingResponse.model_validate(finding)


@router.patch("/{finding_id}", response_model=FindingResponse)
def update_finding_status(
    finding_id: str,
    payload: FindingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates finding status, verifying that the parent scan belongs to the authenticated user.
    """
    finding = (
        db.query(Finding)
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Finding.id == finding_id, Scan.owner_id == current_user.id)
        .first()
    )
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")

    finding.status = payload.status
    finding.last_observed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(finding)
    return FindingResponse.model_validate(finding)
