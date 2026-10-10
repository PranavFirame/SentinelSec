from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.scan import ScanResponse
from backend.app.schemas.finding import FindingResponse


class OverviewMetrics(BaseModel):
    overall_score: int
    total_scans: int
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    info_findings: int
    passed_checks: int
    failed_checks: int
    warning_checks: int
    running_scans: int
    recent_scans: List[ScanResponse]
    recent_findings: List[FindingResponse]
    top_issues: List[Dict[str, Any]]
    is_demo_mode: bool = False


class TrendDataPoint(BaseModel):
    date: str
    average_score: Optional[float]
    total_scans: int
    critical: int
    high: int
    medium: int
    low: int


class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float


class AnalyticsTrends(BaseModel):
    trends: List[TrendDataPoint]
    category_breakdown: List[CategoryCount]
    severity_distribution: Dict[str, int]
    checks_ratio: Dict[str, int]
