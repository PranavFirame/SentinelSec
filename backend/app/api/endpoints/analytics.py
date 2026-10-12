from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.core.auth import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.models.check_execution import CheckExecution
from backend.app.schemas.analytics import OverviewMetrics, AnalyticsTrends, TrendDataPoint, CategoryCount
from backend.app.schemas.scan import ScanResponse, FindingSummary
from backend.app.schemas.finding import FindingResponse

router = APIRouter()


@router.get("/overview", response_model=OverviewMetrics)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes dashboard analytics metrics strictly scoped to the authenticated user.
    """
    # 1. Scans counts for authenticated user
    total_scans = db.query(Scan).filter(Scan.owner_id == current_user.id).count()
    completed_scans = db.query(Scan).filter(Scan.owner_id == current_user.id, Scan.status == "completed").all()
    running_scans = db.query(Scan).filter(
        Scan.owner_id == current_user.id,
        Scan.status.in_(["running", "queued"])
    ).count()

    # Overall score: average of user's completed scans or 100 default if no completed scans
    if completed_scans:
        scores = [s.security_score for s in completed_scans if s.security_score is not None]
        overall_score = int(round(sum(scores) / len(scores))) if scores else 100
    else:
        overall_score = 100

    # 2. User's findings counts by severity
    findings_q = (
        db.query(Finding.severity, func.count(Finding.id))
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.owner_id == current_user.id)
        .group_by(Finding.severity)
        .all()
    )
    sev_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    for sev, count in findings_q:
        if sev.lower() in sev_counts:
            sev_counts[sev.lower()] = count

    total_findings = sum(sev_counts.values())

    # 3. Check stats
    passed_checks = sum(s.checks_passed for s in completed_scans)
    failed_checks = sum(s.checks_failed for s in completed_scans)
    warning_checks = sum(s.checks_skipped for s in completed_scans)

    # 4. User's recent scans (last 5)
    recent_scans_db = (
        db.query(Scan)
        .filter(Scan.owner_id == current_user.id)
        .order_by(desc(Scan.created_at))
        .limit(5)
        .all()
    )
    recent_scans = []
    for s in recent_scans_db:
        r = ScanResponse.model_validate(s)
        sum_f = FindingSummary()
        for f in s.findings:
            sv = f.severity.lower()
            if hasattr(sum_f, sv):
                setattr(sum_f, sv, getattr(sum_f, sv) + 1)
        sum_f.total = len(s.findings)
        r.findings_summary = sum_f
        recent_scans.append(r)

    # 5. User's recent findings (last 6)
    recent_findings_db = (
        db.query(Finding)
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.owner_id == current_user.id)
        .order_by(desc(Finding.first_observed_at))
        .limit(6)
        .all()
    )
    recent_findings = [FindingResponse.model_validate(f) for f in recent_findings_db]

    # 6. Top recurring issues for user
    top_issues_q = (
        db.query(
            Finding.rule_id,
            Finding.title,
            Finding.severity,
            Finding.category,
            func.count(Finding.id).label("count")
        )
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.owner_id == current_user.id)
        .group_by(Finding.rule_id, Finding.title, Finding.severity, Finding.category)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )

    top_issues = [
        {
            "rule_id": r.rule_id,
            "title": r.title,
            "severity": r.severity,
            "category": r.category,
            "count": r.count
        }
        for r in top_issues_q
    ]

    return OverviewMetrics(
        overall_score=overall_score,
        total_scans=total_scans,
        completed_scans=len(completed_scans),
        running_scans=running_scans,
        total_findings=total_findings,
        critical_findings=sev_counts["critical"],
        high_findings=sev_counts["high"],
        medium_findings=sev_counts["medium"],
        low_findings=sev_counts["low"],
        info_findings=sev_counts["informational"],
        passed_checks=passed_checks,
        failed_checks=failed_checks,
        warning_checks=warning_checks,
        recent_scans=recent_scans,
        recent_findings=recent_findings,
        top_issues=top_issues,
        is_demo_mode=False
    )


@router.get("/trends", response_model=AnalyticsTrends)
def get_analytics_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes time-series trend telemetry strictly scoped to the authenticated user.
    """
    scans = (
        db.query(Scan)
        .filter(Scan.owner_id == current_user.id, Scan.status == "completed")
        .order_by(Scan.created_at.asc())
        .all()
    )

    trends_map: Dict[str, Dict[str, Any]] = {}
    for s in scans:
        day_str = s.created_at.strftime("%Y-%m-%d") if s.created_at else "Today"
        if day_str not in trends_map:
            trends_map[day_str] = {
                "date": day_str,
                "scores": [],
                "scans_count": 0,
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            }
        
        trends_map[day_str]["scans_count"] += 1
        if s.security_score is not None:
            trends_map[day_str]["scores"].append(s.security_score)

        for f in s.findings:
            sev = f.severity.lower()
            if sev in trends_map[day_str]:
                trends_map[day_str][sev] += 1

    trend_points: List[TrendDataPoint] = []
    for day, data in trends_map.items():
        avg_score = int(round(sum(data["scores"]) / len(data["scores"]))) if data["scores"] else 100
        trend_points.append(
            TrendDataPoint(
                date=day,
                average_score=avg_score,
                total_scans=data["scans_count"],
                critical=data["critical"],
                high=data["high"],
                medium=data["medium"],
                low=data["low"]
            )
        )


    # Severity distribution
    findings_q = (
        db.query(Finding.severity, func.count(Finding.id))
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.owner_id == current_user.id)
        .group_by(Finding.severity)
        .all()
    )
    sev_distribution = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    for sev, count in findings_q:
        if sev.lower() in sev_distribution:
            sev_distribution[sev.lower()] = count

    # Category breakdown
    cat_q = (
        db.query(Finding.category, func.count(Finding.id))
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.owner_id == current_user.id)
        .group_by(Finding.category)
        .all()
    )
    total_cat_findings = sum(c for _, c in cat_q) or 1
    category_breakdown = [
        CategoryCount(
            category=cat,
            count=count,
            percentage=round((count / total_cat_findings) * 100, 1)
        )
        for cat, count in cat_q
    ]

    # Checks pass/fail ratio for user
    passed = sum(s.checks_passed for s in scans)
    failed = sum(s.checks_failed for s in scans)

    return AnalyticsTrends(
        trends=trend_points,
        severity_distribution=sev_distribution,
        category_breakdown=category_breakdown,
        checks_ratio={"passed": passed, "failed": failed}
    )
