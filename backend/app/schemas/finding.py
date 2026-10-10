from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class FindingResponse(BaseModel):
    id: str
    scan_id: str
    rule_id: str
    title: str
    description: str
    severity: str  # critical, high, medium, low, informational
    category: str
    confidence: str
    status: str  # open, resolved, accepted_risk
    affected_component: str
    evidence: Optional[Dict[str, Any]] = None
    risk_explanation: str
    remediation: str
    references: Optional[List[str]] = None
    cwe_id: Optional[str] = None
    first_observed_at: datetime
    last_observed_at: datetime

    class Config:
        from_attributes = True


class FindingUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|resolved|accepted_risk)$", description="New status for the finding")
