import re
from urllib.parse import urlparse, urljoin
from typing import Dict, Any, List, Optional
import httpx

from backend.app.scanner.checks.base import (
    BaseCheck,
    CheckResult,
    CheckStatus,
    Severity,
    FindingDraft,
    ScanContext
)
from backend.app.scanner.safety.redaction import redact_headers, sanitize_cookie_string


async def get_or_fetch_root(ctx: ScanContext) -> Optional[httpx.Response]:
    """Helper to fetch root target response with caching within the scan."""
    if "root_response" in ctx.cached_responses:
        return ctx.cached_responses["root_response"]

    if not ctx.http_client:
        return None

    try:
        response = await ctx.http_client.get(
            ctx.target_url,
            follow_redirects=False,
            timeout=ctx.timeout_seconds
        )
        ctx.cached_responses["root_response"] = response
        return response
    except Exception as e:
        ctx.cached_responses["root_error"] = str(e)
        return None


# 1. HTTPS Availability
class HttpsAvailabilityCheck(BaseCheck):
    check_id = "SEC-HTTP-001"
    name = "HTTPS Availability"
    category = "Transport Security"
    description = "Determines whether the target host enforces or supports encrypted HTTPS communication."
    default_severity = Severity.HIGH
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        parsed = urlparse(ctx.target_url)
        if parsed.scheme == "https":
            resp = await get_or_fetch_root(ctx)
            if resp and resp.status_code < 500:
                return CheckResult(
                    check_id=self.check_id,
                    check_name=self.name,
                    category=self.category,
                    status=CheckStatus.PASS,
                    details={"scheme": "https", "status_code": resp.status_code, "url": ctx.target_url}
                )

        # If HTTP, try HTTPS on port 443
        https_url = f"https://{parsed.hostname}"
        if ctx.port and ctx.port not in (80, 443):
            https_url += f":{ctx.port}"
        https_url += parsed.path or "/"

        try:
            if not ctx.http_client:
                raise RuntimeError("No HTTP client in context")
            https_resp = await ctx.http_client.get(https_url, timeout=ctx.timeout_seconds, follow_redirects=False)
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING if parsed.scheme == "http" else CheckStatus.PASS,
                details={"https_available": True, "https_status": https_resp.status_code},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Target accessed via unencrypted HTTP",
                        description=f"The target was requested as {ctx.target_url}, but HTTPS is available at {https_url}.",
                        severity=Severity.MEDIUM,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="Cleartext HTTP allows adversaries on the local network or transit path to intercept and modify credentials and traffic.",
                        remediation="Configure the web server to enforce HTTPS exclusively and redirect all HTTP traffic to HTTPS.",
                        references=["https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html"],
                        cwe_id="CWE-319"
                    )
                ] if parsed.scheme == "http" else []
            )
        except Exception as e:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                error_message=f"Failed to establish HTTPS connection: {str(e)}",
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="HTTPS Not Available",
                        description="Target server could not establish an encrypted HTTPS connection.",
                        severity=Severity.HIGH,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="Without HTTPS, user credentials, cookies, and sensitive payload data are vulnerable to passive eavesdropping and active tampering.",
                        remediation="Deploy a trusted TLS certificate and configure web server (Nginx/Apache/Cloudflare) to listen on port 443 with TLS.",
                        references=["https://cwe.mitre.org/data/definitions/319.html"],
                        cwe_id="CWE-319"
                    )
                ]
            )


# 2. HTTP to HTTPS Redirect
class HttpToHttpsRedirectCheck(BaseCheck):
    check_id = "SEC-HTTP-002"
    name = "HTTP to HTTPS Redirect"
    category = "Transport Security"
    description = "Checks whether unencrypted HTTP requests are automatically redirected to HTTPS."
    default_severity = Severity.MEDIUM
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        parsed = urlparse(ctx.target_url)
        http_url = f"http://{parsed.hostname}"
        if ctx.port and ctx.port not in (80, 443):
            http_url += f":{ctx.port}"
        http_url += parsed.path or "/"

        try:
            if not ctx.http_client:
                raise RuntimeError("No HTTP client in context")
            resp = await ctx.http_client.get(http_url, timeout=ctx.timeout_seconds, follow_redirects=False)
            
            # Check redirect status codes (301, 302, 307, 308)
            if resp.status_code in (301, 302, 307, 308):
                location = resp.headers.get("location", "")
                loc_parsed = urlparse(location)
                if loc_parsed.scheme == "https" and (loc_parsed.hostname == parsed.hostname or not loc_parsed.hostname):
                    return CheckResult(
                        check_id=self.check_id,
                        check_name=self.name,
                        category=self.category,
                        status=CheckStatus.PASS,
                        details={"status_code": resp.status_code, "redirect_location": location}
                    )
                else:
                    return CheckResult(
                        check_id=self.check_id,
                        check_name=self.name,
                        category=self.category,
                        status=CheckStatus.WARNING,
                        details={"status_code": resp.status_code, "redirect_location": location},
                        findings=[
                            FindingDraft(
                                rule_id=self.check_id,
                                title="HTTP Redirect Destination Is Not HTTPS on Same Host",
                                description=f"HTTP endpoint redirects to '{location}' which does not cleanly upgrade to HTTPS on the target hostname.",
                                severity=Severity.MEDIUM,
                                category=self.category,
                                affected_component=http_url,
                                risk_explanation="Redirecting to unexpected hosts or unencrypted destinations can introduce man-in-the-middle or open-redirect risks.",
                                remediation="Ensure HTTP requests redirect with a 301 status directly to https://<host>/.",
                                references=["https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html"],
                                cwe_id="CWE-319"
                            )
                        ]
                    )

            # Not a redirect
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details={"status_code": resp.status_code},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Missing HTTP to HTTPS Redirect",
                        description=f"HTTP endpoint {http_url} responded with status {resp.status_code} without redirecting to HTTPS.",
                        severity=Severity.MEDIUM,
                        category=self.category,
                        affected_component=http_url,
                        risk_explanation="Users entering domain names without scheme or clicking legacy http:// links will remain on unencrypted channels.",
                        remediation="Configure the web server to return a 301 Permanent Redirect to the HTTPS equivalent for all HTTP requests.",
                        references=["https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/03-Testing_for_Weak_Transport_Layer_Security"],
                        cwe_id="CWE-319"
                    )
                ]
            )
        except Exception as e:
            # If HTTP port is closed or refused, that's acceptable if HTTPS is enforcing
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING,
                details={"message": f"Could not connect over plain HTTP: {str(e)}"}
            )


# 3. Content-Security-Policy
class ContentSecurityPolicyCheck(BaseCheck):
    check_id = "SEC-CSP-003"
    name = "Content-Security-Policy (CSP)"
    category = "HTTP Headers"
    description = "Inspects whether Content-Security-Policy is present and flags dangerous directives like unsafe-inline, unsafe-eval, or missing default-src."
    default_severity = Severity.MEDIUM
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        csp = resp.headers.get("content-security-policy")
        if not csp:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details={"header_present": False},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Missing Content-Security-Policy Header",
                        description="The Content-Security-Policy header is absent from HTTP responses.",
                        severity=Severity.MEDIUM,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="A Content-Security-Policy restricts scripts, objects, and styles that the browser is allowed to execute, providing defense-in-depth against Cross-Site Scripting (XSS) and data injection.",
                        remediation="Define a strict Content-Security-Policy header such as: default-src 'self'; script-src 'self'; object-src 'none'.",
                        references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP", "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html"],
                        cwe_id="CWE-1021"
                    )
                ]
            )

        weaknesses = []
        csp_lower = csp.lower()
        if "'unsafe-inline'" in csp_lower:
            weaknesses.append("'unsafe-inline' detected in script/style execution")
        if "'unsafe-eval'" in csp_lower:
            weaknesses.append("'unsafe-eval' detected allowing execution of strings as code")
        if "default-src" not in csp_lower:
            weaknesses.append("Missing fallback 'default-src' directive")
        if "*" in csp_lower:
            weaknesses.append("Wildcard '*' source permitted")

        if weaknesses:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING,
                details={"csp_value": csp, "weaknesses": weaknesses},
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-WEAK",
                        title="Permissive Content-Security-Policy Directives",
                        description=f"The CSP header contains permissive directives: {'; '.join(weaknesses)}.",
                        severity=Severity.LOW,
                        category=self.category,
                        affected_component=ctx.target_url,
                        evidence={"csp": csp, "weaknesses": weaknesses},
                        risk_explanation="Permissive CSP directives like 'unsafe-inline' or 'unsafe-eval' weaken XSS mitigation by allowing inline script injection and string evaluation.",
                        remediation="Refactor inline scripts to external bundles or use cryptographic nonces/hashes in script-src.",
                        references=["https://csp.withgoogle.com/docs/strict-csp.html"],
                        cwe_id="CWE-16"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"csp_value": csp}
        )


# 4. Strict-Transport-Security (HSTS)
class StrictTransportSecurityCheck(BaseCheck):
    check_id = "SEC-HSTS-004"
    name = "Strict-Transport-Security (HSTS)"
    category = "HTTP Headers"
    description = "Inspects the HSTS header and validates max-age, includeSubDomains, and preload directives."
    default_severity = Severity.MEDIUM
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        hsts = resp.headers.get("strict-transport-security")
        if not hsts:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details={"header_present": False},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Missing Strict-Transport-Security Header",
                        description="The Strict-Transport-Security (HSTS) response header is not configured.",
                        severity=Severity.MEDIUM,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="Without HSTS, browsers will initiate initial requests over cleartext HTTP, leaving users vulnerable to SSL-stripping and active downgrade attacks.",
                        remediation="Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload to HTTPS response headers.",
                        references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security", "https://hstspreload.org/"],
                        cwe_id="CWE-523"
                    )
                ]
            )

        # Parse directives
        directives = [d.strip().lower() for d in hsts.split(";")]
        max_age_val = None
        has_subdomains = "includesubdomains" in directives
        has_preload = "preload" in directives

        for d in directives:
            if d.startswith("max-age="):
                try:
                    max_age_val = int(d.split("=")[1])
                except ValueError:
                    pass

        issues = []
        if max_age_val is None:
            issues.append("Missing max-age parameter")
        elif max_age_val < 15768000:  # < 6 months
            issues.append(f"Low max-age ({max_age_val} seconds, recommended >= 15768000)")

        if issues:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING,
                details={"hsts_header": hsts, "issues": issues},
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-WEAK",
                        title="Suboptimal Strict-Transport-Security Configuration",
                        description=f"HSTS header is present but flagged: {', '.join(issues)}.",
                        severity=Severity.LOW,
                        category=self.category,
                        affected_component=ctx.target_url,
                        evidence={"hsts": hsts},
                        risk_explanation="A low max-age duration limits how long browsers enforce HTTPS caching, exposing recurring visitors if they clear state or change networks.",
                        remediation="Set max-age to at least 31536000 (1 year) and include includeSubDomains.",
                        references=["https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html"],
                        cwe_id="CWE-523"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"hsts": hsts, "max_age": max_age_val, "includeSubDomains": has_subdomains, "preload": has_preload}
        )


# 5. X-Content-Type-Options
class XContentTypeOptionsCheck(BaseCheck):
    check_id = "SEC-XCTO-005"
    name = "X-Content-Type-Options"
    category = "HTTP Headers"
    description = "Checks whether X-Content-Type-Options is set to nosniff to prevent MIME-sniffing."
    default_severity = Severity.LOW
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        xcto = resp.headers.get("x-content-type-options", "").strip().lower()
        if xcto == "nosniff":
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.PASS,
                details={"x_content_type_options": xcto}
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.FAIL,
            details={"actual_value": xcto or "None"},
            findings=[
                FindingDraft(
                    rule_id=self.check_id,
                    title="Missing or Invalid X-Content-Type-Options Header",
                    description="X-Content-Type-Options header is missing or not set to 'nosniff'.",
                    severity=Severity.LOW,
                    category=self.category,
                    affected_component=ctx.target_url,
                    risk_explanation="Without 'nosniff', browsers may attempt to deduce the MIME type by inspecting bytes, potentially treating non-executable files (e.g. user uploads) as JavaScript or HTML.",
                    remediation="Add 'X-Content-Type-Options: nosniff' to web server response headers.",
                    references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options"],
                    cwe_id="CWE-16"
                )
            ]
        )


# 6. Frame Protection (CSP frame-ancestors & X-Frame-Options)
class FrameProtectionCheck(BaseCheck):
    check_id = "SEC-FRAME-006"
    name = "Frame Protection (Clickjacking Defense)"
    category = "HTTP Headers"
    description = "Inspects CSP frame-ancestors and X-Frame-Options to evaluate framing authorization."
    default_severity = Severity.MEDIUM
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        csp = resp.headers.get("content-security-policy", "").lower()
        xfo = resp.headers.get("x-frame-options", "").strip().upper()

        has_frame_ancestors = "frame-ancestors" in csp
        valid_xfo = xfo in ("DENY", "SAMEORIGIN")

        if has_frame_ancestors or valid_xfo:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.PASS,
                details={"frame_ancestors_present": has_frame_ancestors, "x_frame_options": xfo}
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.FAIL,
            details={"frame_ancestors_present": False, "x_frame_options": xfo or "None"},
            findings=[
                FindingDraft(
                    rule_id=self.check_id,
                    title="Missing Clickjacking Defense (No X-Frame-Options or frame-ancestors)",
                    description="Neither X-Frame-Options nor CSP frame-ancestors directive is defined.",
                    severity=Severity.MEDIUM,
                    category=self.category,
                    affected_component=ctx.target_url,
                    risk_explanation="Attackers can embed this application inside an invisible <iframe> on a malicious website to trick users into executing unauthorized clicks or actions (Clickjacking / UI Redressing).",
                    remediation="Configure 'Content-Security-Policy: frame-ancestors 'none';' or 'X-Frame-Options: DENY'.",
                    references=["https://owasp.org/www-community/attacks/Clickjacking", "https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html"],
                    cwe_id="CWE-1021"
                )
            ]
        )


# 7. Referrer-Policy
class ReferrerPolicyCheck(BaseCheck):
    check_id = "SEC-REFPOL-007"
    name = "Referrer-Policy"
    category = "HTTP Headers"
    description = "Checks for missing or potentially unsafe Referrer-Policy configurations."
    default_severity = Severity.LOW
    profiles = ["standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        policy = resp.headers.get("referrer-policy", "").strip().lower()
        safe_policies = {
            "no-referrer",
            "no-referrer-when-downgrade",
            "origin",
            "origin-when-cross-origin",
            "same-origin",
            "strict-origin",
            "strict-origin-when-cross-origin"
        }

        if policy == "unsafe-url":
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details={"referrer_policy": policy},
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-UNSAFE",
                        title="Unsafe Referrer-Policy Configured ('unsafe-url')",
                        description="The Referrer-Policy is explicitly set to 'unsafe-url'.",
                        severity=Severity.LOW,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="The full URL path and query string parameters (which may contain sensitive tokens, IDs, or search queries) are transmitted to external sites.",
                        remediation="Change Referrer-Policy to 'strict-origin-when-cross-origin' or 'no-referrer'.",
                        references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy"],
                        cwe_id="CWE-200"
                    )
                ]
            )

        if not policy:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING,
                details={"referrer_policy": "Not explicitly set"},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Missing Explicit Referrer-Policy Header",
                        description="The Referrer-Policy header is not explicitly set.",
                        severity=Severity.INFORMATIONAL,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="Modern browsers default to 'strict-origin-when-cross-origin', but explicitly stating the policy eliminates browser divergence and inadvertent leakage.",
                        remediation="Set 'Referrer-Policy: strict-origin-when-cross-origin'.",
                        references=["https://web.dev/referrer-best-practices/"],
                        cwe_id="CWE-200"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"referrer_policy": policy}
        )


# 8. Permissions-Policy
class PermissionsPolicyCheck(BaseCheck):
    check_id = "SEC-PERMPOL-008"
    name = "Permissions-Policy"
    category = "HTTP Headers"
    description = "Reports the presence and configuration of browser feature delegations via Permissions-Policy."
    default_severity = Severity.INFORMATIONAL
    profiles = ["standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        perms = resp.headers.get("permissions-policy")
        if not perms:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING,
                details={"present": False},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Permissions-Policy Header Not Configured",
                        description="The Permissions-Policy (formerly Feature-Policy) header is not defined.",
                        severity=Severity.INFORMATIONAL,
                        category=self.category,
                        affected_component=ctx.target_url,
                        risk_explanation="Permissions-Policy allows developers to explicitly disallow powerful browser APIs (camera, microphone, geolocation, payment) from being used by 3rd-party frames.",
                        remediation="Define Permissions-Policy, e.g., 'camera=(), microphone=(), geolocation=()'.",
                        references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy"],
                        cwe_id="CWE-16"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"permissions_policy": perms}
        )


# 9. Cross-Origin Resource Sharing (CORS)
class CorsConfigurationCheck(BaseCheck):
    check_id = "SEC-CORS-009"
    name = "Cross-Origin Resource Sharing (CORS)"
    category = "Access Control"
    description = "Tests for insecure CORS configurations such as wildcard origins paired with credentials."
    default_severity = Severity.HIGH
    profiles = ["standard"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        if not ctx.http_client:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        test_origin = "https://untrusted-security-test.invalid"
        try:
            resp = await ctx.http_client.get(
                ctx.target_url,
                headers={"Origin": test_origin},
                timeout=ctx.timeout_seconds,
                follow_redirects=False
            )

            acao = resp.headers.get("access-control-allow-origin", "")
            acac = resp.headers.get("access-control-allow-credentials", "").lower() == "true"

            # Check 1: Arbitrary origin reflection with credentials
            if acao == test_origin and acac:
                return CheckResult(
                    check_id=self.check_id,
                    check_name=self.name,
                    category=self.category,
                    status=CheckStatus.FAIL,
                    details={"acao": acao, "acac": True},
                    findings=[
                        FindingDraft(
                            rule_id=f"{self.check_id}-REFLECT-CREDS",
                            title="Arbitrary Origin Reflection with Credentials in CORS",
                            description=f"Server reflected untrusted origin '{test_origin}' and allowed credentials.",
                            severity=Severity.HIGH,
                            category=self.category,
                            affected_component=ctx.target_url,
                            evidence={"Origin": test_origin, "Access-Control-Allow-Origin": acao, "Access-Control-Allow-Credentials": "true"},
                            risk_explanation="Any malicious website visited by an authenticated user can read private authenticated API responses across origins, bypassing Same-Origin Policy entirely.",
                            remediation="Do not blindly reflect the Origin header. Maintain an explicit whitelist of trusted origins.",
                            references=["https://portswigger.net/web-security/cors"],
                            cwe_id="CWE-942"
                        )
                    ]
                )

            # Check 2: Wildcard with credentials (browser blocks, but misconfiguration)
            if acao == "*" and acac:
                return CheckResult(
                    check_id=self.check_id,
                    check_name=self.name,
                    category=self.category,
                    status=CheckStatus.FAIL,
                    details={"acao": "*", "acac": True},
                    findings=[
                        FindingDraft(
                            rule_id=f"{self.check_id}-WILDCARD-CREDS",
                            title="CORS Wildcard with Credentials Configured",
                            description="Server specifies Access-Control-Allow-Origin: * along with Access-Control-Allow-Credentials: true.",
                            severity=Severity.MEDIUM,
                            category=self.category,
                            affected_component=ctx.target_url,
                            risk_explanation="Invalid according to CORS specification and indicates misconfigured access control intent.",
                            remediation="Remove Access-Control-Allow-Credentials or specify explicit trusted origins.",
                            references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"],
                            cwe_id="CWE-942"
                        )
                    ]
                )

            # Wildcard on non-public resource can be warning
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.PASS,
                details={"acao": acao or "None", "acac": acac}
            )
        except Exception as e:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.ERROR,
                error_message=f"CORS test request failed: {str(e)}"
            )


# 10. Cookie Security Attributes
class CookieSecurityCheck(BaseCheck):
    check_id = "SEC-COOKIE-010"
    name = "Cookie Security Attributes"
    category = "HTTP Headers"
    description = "Inspects response cookies for missing Secure, HttpOnly, and SameSite flags."
    default_severity = Severity.MEDIUM
    profiles = ["standard"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        set_cookies = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else [resp.headers.get("set-cookie")]
        set_cookies = [c for c in set_cookies if c]

        if not set_cookies:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.PASS,
                details={"cookies_found": 0, "message": "No Set-Cookie headers returned on endpoint."}
            )

        findings = []
        is_https = urlparse(ctx.target_url).scheme == "https"

        for cookie_str in set_cookies:
            sanitized_cookie = sanitize_cookie_string(cookie_str)
            parts = [p.strip() for p in cookie_str.split(";")]
            cookie_name = parts[0].split("=")[0].strip() if "=" in parts[0] else "unknown"
            
            directives = {p.lower() for p in parts[1:]}
            has_secure = "secure" in directives
            has_httponly = "httponly" in directives
            has_samesite = any(d.startswith("samesite") for d in directives)

            if is_https and not has_secure:
                findings.append(
                    FindingDraft(
                        rule_id=f"{self.check_id}-INSECURE",
                        title=f"Cookie '{cookie_name}' Missing 'Secure' Attribute",
                        description=f"The cookie '{cookie_name}' was set over HTTPS without the 'Secure' attribute.",
                        severity=Severity.MEDIUM,
                        category=self.category,
                        affected_component=f"Cookie: {cookie_name}",
                        evidence={"cookie": sanitized_cookie},
                        risk_explanation="Without 'Secure', the browser may transmit this cookie over cleartext HTTP if the user visits an unencrypted link, leading to session hijacking.",
                        remediation="Append '; Secure' to all Set-Cookie headers in HTTPS applications.",
                        references=["https://owasp.org/www-community/controls/SecureFlag"],
                        cwe_id="CWE-614"
                    )
                )

            # Highlight sensitive/auth cookies missing HttpOnly
            auth_keywords = ["session", "auth", "token", "jwt", "sid", "user", "id"]
            is_potential_auth = any(k in cookie_name.lower() for k in auth_keywords)
            if not has_httponly:
                findings.append(
                    FindingDraft(
                        rule_id=f"{self.check_id}-HTTPONLY",
                        title=f"Cookie '{cookie_name}' Missing 'HttpOnly' Attribute",
                        description=f"The cookie '{cookie_name}' does not contain the 'HttpOnly' directive.",
                        severity=Severity.MEDIUM if is_potential_auth else Severity.LOW,
                        category=self.category,
                        affected_component=f"Cookie: {cookie_name}",
                        evidence={"cookie": sanitized_cookie},
                        risk_explanation="Lacking HttpOnly allows malicious client-side JavaScript (e.g. from XSS vulnerabilities) to read document.cookie and steal session tokens.",
                        remediation="Append '; HttpOnly' to all sensitive session and state cookies.",
                        references=["https://owasp.org/www-community/HttpOnly"],
                        cwe_id="CWE-1004"
                    )
                )

            if not has_samesite:
                findings.append(
                    FindingDraft(
                        rule_id=f"{self.check_id}-SAMESITE",
                        title=f"Cookie '{cookie_name}' Missing 'SameSite' Attribute",
                        description=f"The cookie '{cookie_name}' lacks an explicit SameSite restriction (Lax or Strict).",
                        severity=Severity.LOW,
                        category=self.category,
                        affected_component=f"Cookie: {cookie_name}",
                        evidence={"cookie": sanitized_cookie},
                        risk_explanation="Without SameSite protection, cookies may be attached to cross-site requests, increasing vulnerability to Cross-Site Request Forgery (CSRF).",
                        remediation="Specify 'SameSite=Lax' or 'SameSite=Strict' on cookies.",
                        references=["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite"],
                        cwe_id="CWE-1275"
                    )
                )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.FAIL if any(f.severity in (Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM) for f in findings) else (CheckStatus.WARNING if findings else CheckStatus.PASS),
            details={"cookie_count": len(set_cookies)},
            findings=findings
        )


# 11. Information Disclosure
class InformationDisclosureCheck(BaseCheck):
    check_id = "SEC-INFODISC-011"
    name = "Server Information Disclosure"
    category = "Information Disclosure"
    description = "Inspects HTTP headers for unnecessary server, framework, or runtime version disclosure."
    default_severity = Severity.LOW
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        disclosures = []
        disclosure_headers = [
            "server",
            "x-powered-by",
            "x-aspnet-version",
            "x-aspnetmvc-version",
            "x-generator",
            "x-runtime",
            "x-version"
        ]

        version_regex = re.compile(r"(\d+\.\d+(\.\d+)?)")

        for h in disclosure_headers:
            val = resp.headers.get(h)
            if val:
                has_version = bool(version_regex.search(val))
                disclosures.append({"header": h, "value": val, "has_version": has_version})

        findings = []
        for d in disclosures:
            if d["has_version"] or d["header"].lower() == "x-powered-by":
                findings.append(
                    FindingDraft(
                        rule_id=f"{self.check_id}-{d['header'].upper()}",
                        title=f"Detailed Technology Disclosure via '{d['header']}' Header",
                        description=f"Server returned '{d['header']}: {d['value']}', revealing specific software/version information.",
                        severity=Severity.LOW,
                        category=self.category,
                        affected_component=ctx.target_url,
                        evidence={"header": d["header"], "value": d["value"]},
                        risk_explanation="Disclosing precise server and runtime version numbers makes it easier for attackers to identify known public CVEs and tailored exploits.",
                        remediation=f"Disable the '{d['header']}' banner or strip version details in reverse-proxy or web server settings.",
                        references=["https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server"],
                        cwe_id="CWE-200"
                    )
                )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.WARNING if findings else CheckStatus.PASS,
            details={"disclosures": disclosures},
            findings=findings
        )


# 12. Directory Listing Indicators
class DirectoryListingCheck(BaseCheck):
    check_id = "SEC-DIRLIST-012"
    name = "Directory Listing Indicators"
    category = "Information Disclosure"
    description = "Detects evidence of directory indexing on ordinary accessible endpoints without recursive crawling."
    default_severity = Severity.MEDIUM
    profiles = ["standard"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        resp = await get_or_fetch_root(ctx)
        if not resp:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        content = resp.text[:5000].lower()
        dir_signatures = [
            "index of /",
            "<title>index of",
            "directory listing for /",
            "parent directory</a>",
            "last modified</a></th>",
            "[to parent directory]"
        ]

        found_sig = None
        for sig in dir_signatures:
            if sig in content:
                found_sig = sig
                break

        if found_sig:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details={"signature_matched": found_sig},
                findings=[
                    FindingDraft(
                        rule_id=self.check_id,
                        title="Directory Indexing Detected",
                        description=f"Endpoint exhibits directory index patterns ('{found_sig}').",
                        severity=Severity.MEDIUM,
                        category=self.category,
                        affected_component=ctx.target_url,
                        evidence={"pattern": found_sig},
                        risk_explanation="Directory listings expose folder contents, backups, scripts, and sensitive files to unauthenticated users.",
                        remediation="Disable directory listing (e.g., 'Options -Indexes' in Apache, or 'autoindex off;' in Nginx).",
                        references=["https://cwe.mitre.org/data/definitions/548.html"],
                        cwe_id="CWE-548"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"directory_listing_detected": False}
        )


# 13. Sensitive Path Exposure (Non-destructive)
class SensitivePathExposureCheck(BaseCheck):
    check_id = "SEC-PATH-013"
    name = "Sensitive Path Exposure (Non-destructive)"
    category = "Information Disclosure"
    description = "Checks a small, explicit list of common sensitive files using safe GET requests without downloading secrets."
    default_severity = Severity.HIGH
    profiles = ["standard"]

    # Explicit, small list of non-destructive paths
    PROBE_PATHS = [
        {"path": "/.env", "signature": re.compile(r"^(APP_|DB_|SECRET_|API_)", re.MULTILINE), "desc": "Environment Configuration File"},
        {"path": "/.git/HEAD", "signature": re.compile(r"^ref:\s+refs/", re.MULTILINE), "desc": "Git Repository Metadata"},
        {"path": "/.svn/entries", "signature": re.compile(r"^(\d+|dir|svn:)", re.MULTILINE), "desc": "Subversion Entries"},
        {"path": "/wp-config.php.bak", "signature": re.compile(r"<\?php", re.IGNORECASE), "desc": "PHP Backup File"},
    ]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        if not ctx.http_client:
            return CheckResult(check_id=self.check_id, check_name=self.name, category=self.category, status=CheckStatus.SKIPPED)

        findings = []
        tested_paths = []

        parsed = urlparse(ctx.target_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        for probe in self.PROBE_PATHS:
            target_path = probe["path"]
            probe_url = urljoin(base_url, target_path)
            tested_paths.append(target_path)

            try:
                # Use stream or small byte limit to NEVER download entire secrets
                response = await ctx.http_client.get(
                    probe_url,
                    timeout=min(ctx.timeout_seconds, 6),
                    follow_redirects=False,
                    headers={"Accept": "*/*"}
                )

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "").lower()
                    # If HTML error page, ignore
                    if "text/html" in content_type and not target_path.endswith(".bak"):
                        continue

                    # Read up to 256 bytes for signature validation
                    sample = response.text[:256]
                    if probe["signature"].search(sample):
                        findings.append(
                            FindingDraft(
                                rule_id=f"{self.check_id}-{target_path.replace('/', '_').replace('.', '')}",
                                title=f"Exposed {probe['desc']} at {target_path}",
                                description=f"The sensitive path '{target_path}' returned HTTP 200 with matching file signatures.",
                                severity=Severity.HIGH,
                                category=self.category,
                                affected_component=probe_url,
                                evidence={
                                    "url": probe_url,
                                    "status_code": response.status_code,
                                    "content_length": response.headers.get("content-length", "unknown"),
                                    "note": "Payload contents redacted in accordance with defensive scanning policy."
                                },
                                risk_explanation="Exposed repository metadata or environment files can contain credentials, secret keys, source code history, and internal architecture details.",
                                remediation="Block public access to dotfiles (.git, .env) and backup files (.bak) in the web server configuration.",
                                references=["https://cwe.mitre.org/data/definitions/538.html"],
                                cwe_id="CWE-538"
                            )
                        )
            except Exception:
                continue

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.FAIL if findings else CheckStatus.PASS,
            details={"paths_tested": len(tested_paths), "exposed_paths": len(findings)},
            findings=findings
        )
