from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.models.check_execution import CheckExecution
from backend.app.scanner.risk import calculate_security_score


def seed_demo_data(db: Session, owner_id: str | None = None) -> Dict[str, Any]:
    """
    Seeds realistic historical baseline scan records for demonstration.
    Tagged with [Simulated Demo] in target name to clearly distinguish from user scans.
    """
    now = datetime.now(timezone.utc)

    
    # 1. Target: Legacy Web Portal (Low score / Multiple findings)
    scan_1_date = now - timedelta(days=5)
    findings_1_data = [
        {
            "rule_id": "SEC-HSTS-004",
            "title": "Missing Strict-Transport-Security Header",
            "description": "The Strict-Transport-Security (HSTS) response header is not configured on HTTPS responses.",
            "severity": "medium",
            "category": "HTTP Headers",
            "confidence": "high",
            "affected_component": "https://portal.demo-example.org",
            "risk_explanation": "Users are unprotected against SSL-stripping and active transport downgrade attacks.",
            "remediation": "Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
            "references": ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security"],
            "cwe_id": "CWE-523"
        },
        {
            "rule_id": "SEC-FRAME-006",
            "title": "Missing Clickjacking Defense (No X-Frame-Options or frame-ancestors)",
            "description": "Neither X-Frame-Options nor CSP frame-ancestors directive is defined.",
            "severity": "medium",
            "category": "HTTP Headers",
            "confidence": "high",
            "affected_component": "https://portal.demo-example.org",
            "risk_explanation": "Adversaries can embed portal pages into invisible iframes to hijack user clicks.",
            "remediation": "Configure X-Frame-Options: DENY or CSP frame-ancestors 'none'.",
            "references": ["https://owasp.org/www-community/attacks/Clickjacking"],
            "cwe_id": "CWE-1021"
        },
        {
            "rule_id": "SEC-INFODISC-011-SERVER",
            "title": "Detailed Technology Disclosure via 'server' Header",
            "description": "Server returned 'Server: Apache/2.4.41 (Ubuntu)', disclosing precise operating system and version.",
            "severity": "low",
            "category": "Information Disclosure",
            "confidence": "high",
            "affected_component": "https://portal.demo-example.org",
            "risk_explanation": "Precise version exposure accelerates attacker reconnaissance for targeted CVE exploits.",
            "remediation": "Configure ServerTokens Prod in Apache httpd configuration.",
            "references": ["https://cwe.mitre.org/data/definitions/200.html"],
            "cwe_id": "CWE-200"
        },
        {
            "rule_id": "SEC-TLS-014-EXPIRING-SOON",
            "title": "TLS Certificate Renewal Due (18 Days Remaining)",
            "description": "The TLS certificate for portal.demo-example.org expires in 18 days.",
            "severity": "low",
            "category": "Certificate",
            "confidence": "high",
            "affected_component": "portal.demo-example.org:443",
            "risk_explanation": "Impending expiration requires prompt renewal to avoid user-facing security warnings.",
            "remediation": "Trigger automated ACME/certbot renewal.",
            "references": ["https://cwe.mitre.org/data/definitions/298.html"],
            "cwe_id": "CWE-298"
        }
    ]

    score_1 = calculate_security_score(findings_1_data)
    scan_1 = Scan(
        target="https://portal.demo-example.org [Simulated Demo]",
        profile="standard",
        status="completed",
        created_at=scan_1_date,
        started_at=scan_1_date,
        completed_at=scan_1_date + timedelta(seconds=12),
        duration_seconds=12.4,
        security_score=score_1["final_score"],
        score_breakdown=score_1,
        checks_executed=16,
        checks_passed=12,
        checks_failed=4,
        checks_skipped=0,
        checks_errored=0,
        target_ip="93.184.216.34",
        owner_id=owner_id
    )
    db.add(scan_1)

    db.flush()

    for fd in findings_1_data:
        finding = Finding(
            scan_id=scan_1.id,
            rule_id=fd["rule_id"],
            title=fd["title"],
            description=fd["description"],
            severity=fd["severity"],
            category=fd["category"],
            confidence=fd["confidence"],
            status="open",
            affected_component=fd["affected_component"],
            evidence={"note": "Simulated telemetry evidence"},
            risk_explanation=fd["risk_explanation"],
            remediation=fd["remediation"],
            references=fd["references"],
            cwe_id=fd["cwe_id"],
            first_observed_at=scan_1_date,
            last_observed_at=scan_1_date
        )
        db.add(finding)

    # 2. Target: Hardened API Gateway (High score 94)
    scan_2_date = now - timedelta(days=2)
    findings_2_data = [
        {
            "rule_id": "SEC-PERMPOL-008",
            "title": "Permissions-Policy Header Not Configured",
            "description": "Permissions-Policy is absent from response headers.",
            "severity": "informational",
            "category": "HTTP Headers",
            "confidence": "high",
            "affected_component": "https://api.gateway.demo-example.org",
            "risk_explanation": "Disabling unneeded device capabilities prevents accidental privilege grants.",
            "remediation": "Add Permissions-Policy: camera=(), microphone=(), geolocation=()",
            "references": ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy"],
            "cwe_id": "CWE-16"
        }
    ]
    score_2 = calculate_security_score(findings_2_data)
    scan_2 = Scan(
        target="https://api.gateway.demo-example.org [Simulated Demo]",
        profile="standard",
        status="completed",
        created_at=scan_2_date,
        started_at=scan_2_date,
        completed_at=scan_2_date + timedelta(seconds=8),
        duration_seconds=8.2,
        security_score=score_2["final_score"],
        score_breakdown=score_2,
        checks_executed=16,
        checks_passed=15,
        checks_failed=0,
        checks_skipped=0,
        checks_errored=0,
        target_ip="104.21.55.2",
        owner_id=owner_id
    )
    db.add(scan_2)

    db.flush()

    for fd in findings_2_data:
        finding = Finding(
            scan_id=scan_2.id,
            rule_id=fd["rule_id"],
            title=fd["title"],
            description=fd["description"],
            severity=fd["severity"],
            category=fd["category"],
            confidence=fd["confidence"],
            status="open",
            affected_component=fd["affected_component"],
            evidence={"note": "Simulated gateway evidence"},
            risk_explanation=fd["risk_explanation"],
            remediation=fd["remediation"],
            references=fd["references"],
            cwe_id=fd["cwe_id"],
            first_observed_at=scan_2_date,
            last_observed_at=scan_2_date
        )
        db.add(finding)

    # 3. Target: Staging Web App with CORS Misconfiguration (Score 68)
    scan_3_date = now - timedelta(hours=6)
    findings_3_data = [
        {
            "rule_id": "SEC-CORS-009-REFLECT-CREDS",
            "title": "Arbitrary Origin Reflection with Credentials in CORS",
            "description": "Server reflected untrusted origin and allowed credentials.",
            "severity": "high",
            "category": "Access Control",
            "confidence": "high",
            "affected_component": "https://staging.app.demo-example.org",
            "risk_explanation": "Malicious 3rd-party sites can read authenticated user responses across origins.",
            "remediation": "Whitelist explicit authorized frontend origins.",
            "references": ["https://portswigger.net/web-security/cors"],
            "cwe_id": "CWE-942"
        },
        {
            "rule_id": "SEC-CSP-003",
            "title": "Missing Content-Security-Policy Header",
            "description": "Content-Security-Policy header is absent.",
            "severity": "medium",
            "category": "HTTP Headers",
            "confidence": "high",
            "affected_component": "https://staging.app.demo-example.org",
            "risk_explanation": "Lacks defense-in-depth against client script injection.",
            "remediation": "Configure strict Content-Security-Policy.",
            "references": ["https://csp.withgoogle.com/docs/strict-csp.html"],
            "cwe_id": "CWE-1021"
        }
    ]
    score_3 = calculate_security_score(findings_3_data)
    scan_3 = Scan(
        target="https://staging.app.demo-example.org [Simulated Demo]",
        profile="standard",
        status="completed",
        created_at=scan_3_date,
        started_at=scan_3_date,
        completed_at=scan_3_date + timedelta(seconds=10),
        duration_seconds=10.1,
        security_score=score_3["final_score"],
        score_breakdown=score_3,
        checks_executed=16,
        checks_passed=13,
        checks_failed=3,
        checks_skipped=0,
        checks_errored=0,
        target_ip="172.67.180.200",
        owner_id=owner_id
    )
    db.add(scan_3)

    db.flush()

    for fd in findings_3_data:
        finding = Finding(
            scan_id=scan_3.id,
            rule_id=fd["rule_id"],
            title=fd["title"],
            description=fd["description"],
            severity=fd["severity"],
            category=fd["category"],
            confidence=fd["confidence"],
            status="open",
            affected_component=fd["affected_component"],
            evidence={"note": "Simulated CORS reflection evidence"},
            risk_explanation=fd["risk_explanation"],
            remediation=fd["remediation"],
            references=fd["references"],
            cwe_id=fd["cwe_id"],
            first_observed_at=scan_3_date,
            last_observed_at=scan_3_date
        )
        db.add(finding)

    db.commit()
    return {"message": "Demo baseline scans successfully populated", "scans_created": 3}


def clear_demo_data(db: Session) -> Dict[str, Any]:
    """
    Clears only scans that contain '[Simulated Demo]' in the target name,
    leaving user-generated scans untouched.
    """
    demo_scans = db.query(Scan).filter(Scan.target.like("%[Simulated Demo]%")).all()
    count = len(demo_scans)
    for s in demo_scans:
        db.delete(s)
    db.commit()
    return {"message": f"Removed {count} simulated demo scans", "deleted_count": count}
