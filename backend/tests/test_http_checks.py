import pytest
import httpx
from unittest.mock import AsyncMock, patch

from backend.app.scanner.checks.base import ScanContext, CheckStatus, Severity
from backend.app.scanner.checks.http_checks import (
    ContentSecurityPolicyCheck,
    StrictTransportSecurityCheck,
    XContentTypeOptionsCheck,
    FrameProtectionCheck,
    ReferrerPolicyCheck,
    CookieSecurityCheck,
    InformationDisclosureCheck,
    DirectoryListingCheck,
)


def make_mock_response(status_code: int = 200, headers: dict = None, text: str = "") -> httpx.Response:
    request = httpx.Request("GET", "https://example.com")
    return httpx.Response(status_code=status_code, headers=headers or {}, text=text, request=request)


@pytest.mark.asyncio
async def test_csp_check_missing():
    check = ContentSecurityPolicyCheck()
    mock_resp = make_mock_response(200, {})
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": mock_resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    assert len(result.findings) == 1
    assert result.findings[0].rule_id == "SEC-CSP-003"


@pytest.mark.asyncio
async def test_csp_check_weak_directives():
    check = ContentSecurityPolicyCheck()
    mock_resp = make_mock_response(200, {"content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'"})
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": mock_resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.WARNING
    assert "unsafe-inline" in result.findings[0].description


@pytest.mark.asyncio
async def test_csp_check_pass():
    check = ContentSecurityPolicyCheck()
    mock_resp = make_mock_response(200, {"content-security-policy": "default-src 'self'; script-src 'self'; object-src 'none'"})
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": mock_resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.PASS
    assert len(result.findings) == 0


@pytest.mark.asyncio
async def test_hsts_missing():
    check = StrictTransportSecurityCheck()
    mock_resp = make_mock_response(200, {})
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": mock_resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    assert result.findings[0].rule_id == "SEC-HSTS-004"


@pytest.mark.asyncio
async def test_hsts_pass():
    check = StrictTransportSecurityCheck()
    mock_resp = make_mock_response(200, {"strict-transport-security": "max-age=31536000; includeSubDomains; preload"})
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": mock_resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.PASS


@pytest.mark.asyncio
async def test_xcto_nosniff_present_and_missing():
    check = XContentTypeOptionsCheck()
    
    # Missing
    resp_bad = make_mock_response(200, {})
    ctx_bad = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": resp_bad})
    res_bad = await check.run_check(ctx_bad)
    assert res_bad.status == CheckStatus.FAIL

    # Present
    resp_good = make_mock_response(200, {"x-content-type-options": "nosniff"})
    ctx_good = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": resp_good})
    res_good = await check.run_check(ctx_good)
    assert res_good.status == CheckStatus.PASS


@pytest.mark.asyncio
async def test_frame_protection():
    check = FrameProtectionCheck()
    
    # Missing
    resp_bad = make_mock_response(200, {})
    ctx_bad = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": resp_bad})
    res_bad = await check.run_check(ctx_bad)
    assert res_bad.status == CheckStatus.FAIL

    # X-Frame-Options DENY
    resp_good = make_mock_response(200, {"x-frame-options": "DENY"})
    ctx_good = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": resp_good})
    res_good = await check.run_check(ctx_good)
    assert res_good.status == CheckStatus.PASS


@pytest.mark.asyncio
async def test_cookie_security_flags():
    check = CookieSecurityCheck()
    resp = make_mock_response(200, {"set-cookie": "session_id=12345; Path=/"})
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    rules = [f.rule_id for f in result.findings]
    assert "SEC-COOKIE-010-INSECURE" in rules
    assert "SEC-COOKIE-010-HTTPONLY" in rules


@pytest.mark.asyncio
async def test_directory_listing_detected():
    check = DirectoryListingCheck()
    resp = make_mock_response(200, {}, text="<html><head><title>Index of /uploads</title></head><body><h1>Index of /uploads</h1>")
    ctx = ScanContext("https://example.com", "example.com", 443, "93.184.216.34", cached_responses={"root_response": resp})

    result = await check.run_check(ctx)
    assert result.status == CheckStatus.FAIL
    assert "Directory Indexing Detected" in result.findings[0].title
