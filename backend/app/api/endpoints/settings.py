from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.services.seed import seed_demo_data, clear_demo_data
from backend.app.scanner.checks.registry import ALL_CHECKS

router = APIRouter()


class SettingsUpdate(BaseModel):
    allow_local_targets: bool = Field(..., description="Enable localhost / private IP scanning for local development only")
    default_timeout: int = Field(default=15, ge=5, le=60)


@router.get("")
def get_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "allow_local_targets": settings.ALLOW_LOCAL_TARGETS,
        "max_scan_timeout_seconds": settings.MAX_SCAN_TIMEOUT_SECONDS,
        "default_timeout_seconds": settings.DEFAULT_TIMEOUT_SECONDS,
        "max_concurrent_scans": settings.MAX_CONCURRENT_SCANS,
        "max_redirects": settings.MAX_REDIRECTS,
        "allowed_ports": settings.ALLOWED_PORTS,
        "osv_api_url": settings.OSV_API_URL,
        "database_url": settings.DATABASE_URL.split("///")[-1],
        "capabilities": {
            "enabled": [
                "Automated non-destructive HTTP security headers inspection",
                "TLS certificate expiration and trust chain verification",
                "CORS misconfiguration detection",
                "Cookie flags (HttpOnly, Secure, SameSite) auditing",
                "Sensitive path exposure detection (safe headers & signatures)",
                "Dependency manifest scanning (package-lock.json, requirements.txt, poetry.lock)",
                "OSV vulnerability database integration with CVE mapping",
                "Deterministic deduplicated risk scoring (0-100)",
                "Interactive D3.js telemetry and historical scan comparison"
            ],
            "disabled_out_of_scope": [
                "Active exploitation or payload injection (SQLi, RCE, command injection)",
                "Credential brute-forcing or dictionary attacks",
                "Recursive directory spidering / aggressive crawling",
                "Authenticated session traversal",
                "Denial-of-Service or load stressing"
            ]
        }
    }


@router.post("/update")
def update_settings(payload: SettingsUpdate):
    settings.ALLOW_LOCAL_TARGETS = payload.allow_local_targets
    settings.DEFAULT_TIMEOUT_SECONDS = payload.default_timeout
    return {
        "message": "Settings updated successfully",
        "allow_local_targets": settings.ALLOW_LOCAL_TARGETS,
        "default_timeout_seconds": settings.DEFAULT_TIMEOUT_SECONDS
    }


from backend.app.core.auth import get_current_user_optional
from backend.app.models.user import User


@router.post("/demo/seed")
def seed_demo(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
):
    owner_id = current_user.id if current_user else None
    return seed_demo_data(db, owner_id=owner_id)


@router.post("/demo/clear")
def clear_demo(db: Session = Depends(get_db)):
    return clear_demo_data(db)

