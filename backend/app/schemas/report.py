from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.scan import ScanResponse
from backend.app.schemas.finding import FindingResponse
from backend.app.schemas.check import CheckExecutionResponse


class JSONReport(BaseModel):
    schema_version: str = "1.0.0"
    scanner_name: str = "SentinelSec Security Assessment Engine"
    scanner_version: str = "1.0.0"
    generated_at: datetime
    scan: ScanResponse
    score_breakdown: Optional[Dict[str, Any]]
    findings: List[FindingResponse]
    check_executions: List[CheckExecutionResponse]
    disclaimer: str = (
        "SentinelSec performs non-destructive, defensive automated security checks. "
        "A score of 100 or passing checks does not guarantee absolute security or absence of zero-days. "
        "Authenticated testing and source code reviews should complement these automated assessments."
    )
