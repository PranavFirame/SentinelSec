from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel


class CheckDefinition(BaseModel):
    id: str
    name: str
    category: str
    description: str
    default_severity: str
    profiles: List[str]
    is_network_check: bool = True


class CheckExecutionResponse(BaseModel):
    id: str
    scan_id: str
    check_id: str
    check_name: str
    category: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    execution_time_ms: float = 0.0
    result_details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
