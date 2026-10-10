from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, field_validator


class ScanCreate(BaseModel):
    target: str = Field(..., description="Target URL (e.g. https://example.com)")
    profile: str = Field(default="standard", description="quick, standard, tls_headers, dependency")
    enabled_checks: Optional[List[str]] = Field(default=None, description="Optional custom list of check IDs")
    timeout_seconds: Optional[int] = Field(default=15, ge=5, le=60, description="Scan timeout per request")
    permission_confirmed: bool = Field(
        ...,
        description="Explicit user confirmation that they own or are authorized to assess this target"
    )

    @field_validator("permission_confirmed")
    @classmethod
    def validate_permission(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must confirm that you have explicit authorization to assess this target.")
        return v


class ScanProgress(BaseModel):
    scan_id: str
    status: str
    checks_executed: int
    checks_total: int
    percent_complete: int
    current_check: Optional[str] = None
    duration_seconds: Optional[float] = None


class FindingSummary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    informational: int = 0
    total: int = 0


class ScanResponse(BaseModel):
    id: str
    target: str
    profile: str
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    security_score: Optional[int] = None
    score_breakdown: Optional[Dict[str, Any]] = None
    checks_executed: int = 0
    checks_passed: int = 0
    checks_failed: int = 0
    checks_skipped: int = 0
    checks_errored: int = 0
    target_ip: Optional[str] = None
    error_summary: Optional[str] = None
    findings_summary: Optional[FindingSummary] = None

    class Config:
        from_attributes = True


class ScanComparisonResult(BaseModel):
    scan_a_id: str
    scan_b_id: str
    scan_a_target: str
    scan_b_target: str
    scan_a_date: datetime
    scan_b_date: datetime
    scan_a_score: Optional[int]
    scan_b_score: Optional[int]
    score_delta: Optional[int]
    new_findings: List[Dict[str, Any]]
    resolved_findings: List[Dict[str, Any]]
    recurring_findings: List[Dict[str, Any]]
