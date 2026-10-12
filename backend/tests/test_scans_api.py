import pytest
from unittest.mock import patch, AsyncMock
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding


def test_health_endpoints(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_ready = client.get("/api/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"


def test_scan_creation_rejects_ssrf_targets(client):
    # Attempting to scan loopback without allow_local should return 400
    res = client.post("/api/scans", json={
        "target": "http://127.0.0.1",
        "profile": "standard",
        "permission_confirmed": True
    })
    assert res.status_code == 400
    assert "SSRF" in res.json()["detail"] or "rejected" in res.json()["detail"]


def test_scan_creation_requires_permission_confirmation(client):
    res = client.post("/api/scans", json={
        "target": "https://example.com",
        "profile": "standard",
        "permission_confirmed": False
    })
    assert res.status_code == 422  # Pydantic validation failure


def test_scan_creation_valid_target(client, mocker):
    # Mock SSRF DNS resolution to public IP
    mocker.patch("backend.app.scanner.safety.ssrf.validate_target_url", return_value=("https://example.com/", "93.184.216.34", 443))
    mocker.patch("backend.app.services.scan_manager.scan_manager.start_scan_job", new_callable=AsyncMock)

    res = client.post("/api/scans", json={
        "target": "https://example.com",
        "profile": "quick",
        "permission_confirmed": True
    })
    assert res.status_code == 201
    data = res.json()
    assert data["target"] == "https://example.com/"
    assert data["status"] == "queued"
    assert "id" in data


def test_scan_lifecycle_and_details(client, db_session, test_user):
    # Create scan directly in DB
    scan = Scan(
        target="https://example.com/",
        profile="standard",
        status="completed",
        security_score=85,
        checks_executed=16,
        checks_passed=14,
        checks_failed=2,
        owner_id=test_user.id
    )
    db_session.add(scan)
    db_session.flush()


    finding = Finding(
        scan_id=scan.id,
        rule_id="SEC-HSTS-004",
        title="Missing HSTS",
        description="Missing HSTS header",
        severity="medium",
        category="HTTP Headers",
        confidence="high",
        status="open",
        affected_component="https://example.com",
        risk_explanation="Exposure to MITM",
        remediation="Add HSTS header"
    )
    db_session.add(finding)
    db_session.commit()

    # Get scan
    res = client.get(f"/api/scans/{scan.id}")
    assert res.status_code == 200
    assert res.json()["security_score"] == 85
    assert res.json()["findings_summary"]["medium"] == 1

    # Get findings
    res_f = client.get(f"/api/scans/{scan.id}/findings")
    assert res_f.status_code == 200
    assert len(res_f.json()) == 1
    assert res_f.json()[0]["rule_id"] == "SEC-HSTS-004"

    # Update finding status
    finding_id = res_f.json()[0]["id"]
    patch_res = client.patch(f"/api/findings/{finding_id}", json={"status": "resolved"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "resolved"

    # Report JSON
    res_rep = client.get(f"/api/reports/{scan.id}/json")
    assert res_rep.status_code == 200
    assert res_rep.json()["schema_version"] == "1.0.0"
    assert len(res_rep.json()["findings"]) == 1


def test_scan_comparison(client, db_session, test_user):
    scan_1 = Scan(target="https://example.com", profile="standard", status="completed", security_score=80, owner_id=test_user.id)
    scan_2 = Scan(target="https://example.com", profile="standard", status="completed", security_score=95, owner_id=test_user.id)
    db_session.add_all([scan_1, scan_2])
    db_session.flush()


    f1 = Finding(
        scan_id=scan_1.id, rule_id="SEC-HSTS-004", title="Missing HSTS",
        description="Strict-Transport-Security header is absent.",
        severity="medium", category="HTTP Headers", affected_component="https://example.com",
        risk_explanation="Risk", remediation="Fix"
    )
    f2 = Finding(
        scan_id=scan_2.id, rule_id="SEC-PERMPOL-008", title="Missing Permissions-Policy",
        description="Permissions-Policy header is absent.",
        severity="informational", category="HTTP Headers", affected_component="https://example.com",
        risk_explanation="Risk", remediation="Fix"
    )
    db_session.add_all([f1, f2])
    db_session.commit()

    res = client.post(f"/api/scans/{scan_1.id}/compare/{scan_2.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["score_delta"] == 15
    assert len(data["new_findings"]) == 1
    assert data["new_findings"][0]["rule_id"] == "SEC-PERMPOL-008"
    assert len(data["resolved_findings"]) == 1
    assert data["resolved_findings"][0]["rule_id"] == "SEC-HSTS-004"


def test_analytics_and_demo_seed(client):
    # Seed demo
    res_seed = client.post("/api/settings/demo/seed")
    assert res_seed.status_code == 200
    assert res_seed.json()["scans_created"] == 3

    # Overview
    res_over = client.get("/api/analytics/overview")
    assert res_over.status_code == 200
    data = res_over.json()
    assert data["total_scans"] >= 3
    assert data["total_findings"] >= 5

    # Trends
    res_trends = client.get("/api/analytics/trends")
    assert res_trends.status_code == 200
    assert len(res_trends.json()["trends"]) >= 3

    # Clear demo
    res_clear = client.post("/api/settings/demo/clear")
    assert res_clear.status_code == 200
    assert res_clear.json()["deleted_count"] >= 3
