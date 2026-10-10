from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.db.session import get_db
from backend.app.models.finding import Finding
from backend.app.schemas.finding import FindingResponse, FindingUpdate

router = APIRouter()


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")
    return FindingResponse.model_validate(finding)


@router.patch("/{finding_id}", response_model=FindingResponse)
def update_finding_status(finding_id: str, payload: FindingUpdate, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")

    finding.status = payload.status
    finding.last_observed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(finding)
    return FindingResponse.model_validate(finding)
