import pytest
from datetime import datetime, timezone, timedelta
from backend.app.scanner.checks.base import ScanContext, CheckStatus, Severity
from backend.app.scanner.checks.tls_checks import (
    CertificateExpiryCheck,
    CertificateHostnameAndTrustCheck,
    TlsProtocolConfigurationCheck
)


@pytest.mark.asyncio
async def test_certificate_expired():
    check = CertificateExpiryCheck()
    now = datetime.now(timezone.utc)
    expired_date = (now - timedelta(days=10)).isoformat()
    tls_mock = {
        "days_remaining": -10,
        "is_expired": True,
        "not_after": expired_date,
        "port": 443,
        "issuer": "Mock CA"
    }
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"tls_data": tls_mock})
    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    assert result.findings[0].severity == Severity.CRITICAL
    assert "Expired" in result.findings[0].title


@pytest.mark.asyncio
async def test_certificate_valid():
    check = CertificateExpiryCheck()
    now = datetime.now(timezone.utc)
    future_date = (now + timedelta(days=180)).isoformat()
    tls_mock = {
        "days_remaining": 180,
        "is_expired": False,
        "not_after": future_date,
        "port": 443,
        "issuer": "Let's Encrypt"
    }
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"tls_data": tls_mock})
    result = await check.run_check(ctx)
    assert result.status == CheckStatus.PASS
    assert len(result.findings) == 0


@pytest.mark.asyncio
async def test_certificate_hostname_mismatch():
    check = CertificateHostnameAndTrustCheck()
    tls_mock = {
        "hostname": "example.com",
        "common_name": "other-domain.org",
        "san_list": ["other-domain.org", "api.other-domain.org"],
        "trusted": True,
        "port": 443,
        "issuer": "Valid CA"
    }
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"tls_data": tls_mock})
    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    assert "Certificate Hostname Mismatch" in result.findings[0].title


@pytest.mark.asyncio
async def test_tls_deprecated_protocol():
    check = TlsProtocolConfigurationCheck()
    tls_mock = {
        "tls_version": "TLSv1",
        "cipher": "ECDHE-RSA-AES128-SHA",
        "port": 443
    }
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"tls_data": tls_mock})
    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    assert "Deprecated TLS Protocol" in result.findings[0].title
