from backend.app.scanner.risk import calculate_security_score


def test_score_empty_findings():
    result = calculate_security_score([])
    assert result["final_score"] == 100
    assert result["total_penalty"] == 0.0
    assert result["rating"] == "A (Optimal)"


def test_score_single_critical():
    findings = [
        {"rule_id": "SEC-TLS-014-EXPIRED", "title": "Expired TLS Cert", "severity": "critical", "confidence": "high"}
    ]
    result = calculate_security_score(findings)
    assert result["final_score"] == 75
    assert result["total_penalty"] == 25.0


def test_deduplication_diminishing_penalty():
    # 3 instances of the same rule (e.g. 3 cookies missing HttpOnly)
    single_finding = [
        {"rule_id": "SEC-COOKIE-010-HTTPONLY", "title": "Missing HttpOnly", "severity": "medium", "confidence": "high"}
    ]
    single_res = calculate_security_score(single_finding)

    three_findings = [
        {"rule_id": "SEC-COOKIE-010-HTTPONLY", "title": "Missing HttpOnly 1", "severity": "medium", "confidence": "high"},
        {"rule_id": "SEC-COOKIE-010-HTTPONLY", "title": "Missing HttpOnly 2", "severity": "medium", "confidence": "high"},
        {"rule_id": "SEC-COOKIE-010-HTTPONLY", "title": "Missing HttpOnly 3", "severity": "medium", "confidence": "high"},
    ]
    three_res = calculate_security_score(three_findings)

    # 3x linear would be 24 penalty, but with deduplication it should be:
    # 8 * 1.0 + 8 * 0.35 + 8 * 0.15 = 8 + 2.8 + 1.2 = 12.0
    assert three_res["total_penalty"] < (single_res["total_penalty"] * 3)
    assert three_res["unique_rules_evaluated"] == 1


def test_score_clamping_to_zero():
    # 10 critical findings
    many_critical = [
        {"rule_id": f"CRIT-{i}", "title": f"Critical Issue {i}", "severity": "critical", "confidence": "high"}
        for i in range(10)
    ]
    result = calculate_security_score(many_critical)
    assert result["final_score"] == 0
