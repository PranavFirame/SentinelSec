from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.db.session import get_db
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.models.check_execution import CheckExecution
from backend.app.schemas.analytics import OverviewMetrics, AnalyticsTrends, TrendDataPoint, CategoryCount
from backend.app.schemas.scan import ScanResponse, FindingSummary
from backend.app.schemas.finding import FindingResponse

router = APIRouter()


@router.get("/overview", response_model=OverviewMetrics)
def get_analytics_overview(db: Session = Depends(get_db)):
    # 1. Scans counts
    total_scans = db.query(Scan).count()
    completed_scans = db.query(Scan).filter(Scan.status == "completed").all()
    running_scans = db.query(Scan).filter(Scan.status.in_(["running", "queued"])).count()

    # Overall score: average of completed scans or 100 default if empty
    if completed_scans:
        scores = [s.security_score for s in completed_scans if s.security_score is not None]
        overall_score = int(round(sum(scores) / len(scores))) if scores else 100
    else:
        overall_score = 100

    # 2. Findings counts by severity
    findings_q = db.query(Finding.severity, func.count(Finding.id)).group_by(Finding.severity).all()
    sev_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    for sev, count in findings_q:
        if sev.lower() in sev_counts:
            sev_counts[sev.lower()] = count

    total_findings = sum(sev_counts.values())

    # 3. Check stats
    passed_checks = sum(s.checks_passed for s in completed_scans)
    failed_checks = sum(s.checks_failed for s in completed_scans)
    warning_checks = sum(s.checks_skipped for s in completed_scans)

    # 4. Recent scans (last 5)
    recent_scans_db = db.query(Scan).order_by(desc(Scan.created_at)).limit(5).all()
    recent_scans = []
    for s in recent_scans_db:
        r = ScanResponse.model_validate(s)
        # findings summary
        sum_f = FindingSummary()
        for f in s.findings:
            sv = f.severity.lower()
            if hasattr(sum_f, sv):
                setattr(sum_f, sv, getattr(sum_f, sv) + 1)
        sum_f.total = len(s.findings)
        r.findings_summary = sum_f
        recent_scans.append(r)

    # 5. Recent findings (last 6)
    recent_findings_db = db.query(Finding).order_by(desc(Finding.first_observed_at)).limit(6).all()
    recent_findings = [FindingResponse.model_validate(f) for f in recent_findings_db]

    # 6. Top recurring security issues
    top_issues_q = (
        db.query(Finding.rule_id, Finding.title, Finding.severity, Finding.category, func.count(Finding.id).label("count"))
        .group_by(Finding.rule_id, Finding.title, Finding.severity, Finding.category)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )
    top_issues = [
        {
            "rule_id": item[0],
            "title": item[1],
            "severity": item[2],
            "category": item[3],
            "count": item[4]
        }
        for item in top_issues_q
    ]

    has_demo = any("[Simulated Demo]" in s.target for s in recent_scans_db)

    return OverviewMetrics(
        overall_score=overall_score,
        total_scans=total_scans,
        total_findings=total_findings,
        critical_findings=sev_counts["critical"],
        high_findings=sev_counts["high"],
        medium_findings=sev_counts["medium"],
        low_findings=sev_counts["low"],
        info_findings=sev_counts["informational"],
        passed_checks=passed_checks,
        failed_checks=failed_checks,
        warning_checks=warning_checks,
        running_scans=running_scans,
        recent_scans=recent_scans,
        recent_findings=recent_findings,
        top_issues=top_issues,
        is_demo_mode=has_demo
    )


@router.get("/trends", response_model=AnalyticsTrends)
def get_analytics_trends(db: Session = Depends(get_db)):
    scans = db.query(Scan).filter(Scan.status == "completed").order_by(Scan.created_at).all()
    
    # Trends by scan or date
    trends: List[TrendDataPoint] = []
    for s in scans:
        crit = sum(1 for f in s.findings if f.severity.lower() == "critical")
        hi = sum(1 for f in s.findings if f.severity.lower() == "high")
        med = sum(1 for f in s.findings if f.severity.lower() == "medium")
        lo = sum(1 for f in s.findings if f.severity.lower() == "low")
        trends.append(TrendDataPoint(
            date=s.created_at.strftime("%b %d %H:%M"),
            average_score=float(s.security_score) if s.security_score is not None else 100.0,
            total_scans=1,
            critical=crit,
            high=hi,
            medium=med,
            low=lo
        ))

    # Category breakdown
    cat_q = db.query(Finding.category, func.count(Finding.id)).group_by(Finding.category).all()
    total_f = sum(c[1] for c in cat_q) or 1
    category_breakdown = [
        CategoryCount(
            category=cat,
            count=count,
            percentage=round((count / total_f) * 100, 1)
        )
        for cat, count in cat_q
    ]

    # Severity distribution
    sev_q = db.query(Finding.severity, func.count(Finding.id)).group_by(Finding.severity).all()
    sev_dist = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    for s, c in sev_q:
        if s.lower() in sev_dist:
            sev_dist[s.lower()] = c

    # Checks passed vs failed
    passed_total = sum(s.checks_passed for s in scans)
    failed_total = sum(s.checks_failed for s in scans)
    checks_ratio = {"passed": passed_total, "failed": failed_total}

    return AnalyticsTrends(
        trends=trends,
        category_breakdown=category_breakdown,
        severity_distribution=sev_dist,
        checks_ratio=checks_ratio
    )
