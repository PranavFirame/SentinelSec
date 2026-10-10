import ipaddress
import pytest
from backend.app.scanner.safety.ssrf import is_ip_blocked, validate_target_url, SSRFValidationError
from backend.app.scanner.safety.redaction import redact_headers, sanitize_cookie_string, sanitize_evidence


def test_loopback_ip_blocked():
    blocked, reason = is_ip_blocked(ipaddress.ip_address("127.0.0.1"), allow_local=False)
    assert blocked is True
    assert "Loopback" in reason


def test_private_ips_blocked():
    for ip_str in ["10.0.0.1", "172.16.0.5", "192.168.1.100"]:
        blocked, reason = is_ip_blocked(ipaddress.ip_address(ip_str), allow_local=False)
        assert blocked is True
        assert "Private" in reason


def test_cloud_metadata_strictly_blocked():
    blocked, reason = is_ip_blocked(ipaddress.ip_address("169.254.169.254"), allow_local=True)
    assert blocked is True
    assert "metadata" in reason.lower()


def test_allow_local_permits_loopback_for_testing():
    blocked, _ = is_ip_blocked(ipaddress.ip_address("127.0.0.1"), allow_local=True)
    assert blocked is False


def test_validate_target_url_invalid_schemes():
    with pytest.raises(SSRFValidationError, match="Unsupported scheme"):
        validate_target_url("ftp://example.com")

    with pytest.raises(SSRFValidationError, match="Unsupported scheme"):
        validate_target_url("file:///etc/passwd")

    with pytest.raises(SSRFValidationError, match="Unsupported scheme"):
        validate_target_url("gopher://example.com")


def test_validate_target_url_disallowed_port():
    with pytest.raises(SSRFValidationError, match="allowed scanner port list"):
        validate_target_url("https://example.com:22")


def test_redact_sensitive_headers():
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "X-Api-Key": "super-secret-key-12345",
        "Set-Cookie": "session_id=s3cr3t; Path=/; Secure; HttpOnly",
        "Content-Type": "application/json"
    }
    redacted = redact_headers(headers)
    assert redacted["Authorization"] == "[REDACTED_CREDENTIAL]"
    assert redacted["X-Api-Key"] == "[REDACTED_CREDENTIAL]"
    assert "session_id=[REDACTED]" in redacted["Set-Cookie"]
    assert "Secure" in redacted["Set-Cookie"]
    assert "HttpOnly" in redacted["Set-Cookie"]
    assert redacted["Content-Type"] == "application/json"


def test_sanitize_cookie_string():
    cookie = "jwt=abcdef1234567890; Domain=example.com; Path=/; Secure; SameSite=Strict"
    sanitized = sanitize_cookie_string(cookie)
    assert "jwt=[REDACTED]" in sanitized
    assert "Domain=example.com" in sanitized
    assert "Secure" in sanitized
    assert "SameSite=Strict" in sanitized
