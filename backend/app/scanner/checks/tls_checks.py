import ssl
import socket
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from cryptography import x509
from cryptography.hazmat.backends import default_backend

from backend.app.scanner.checks.base import (
    BaseCheck,
    CheckResult,
    CheckStatus,
    Severity,
    FindingDraft,
    ScanContext
)


def inspect_tls_certificate(hostname: str, port: int = 443, timeout: int = 10) -> Dict[str, Any]:
    """
    Connects via SSL to retrieve negotiated protocol, cipher, peer certificate, and validation state.
    """
    context = ssl.create_default_context()
    # We first try with system validation
    validation_error = None
    trusted = True

    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                der_cert = ssock.getpeercert(binary_form=True)
                version_str = ssock.version()
                cipher_tuple = ssock.cipher()
                cipher_name = cipher_tuple[0] if cipher_tuple else "Unknown"
    except ssl.SSLCertVerificationError as e:
        validation_error = str(e)
        trusted = False
        # Retry with cert verification disabled to inspect the failing certificate's properties
        ctx_unverified = ssl._create_unverified_context()
        try:
            with socket.create_connection((hostname, port), timeout=timeout) as sock:
                with ctx_unverified.wrap_socket(sock, server_hostname=hostname) as ssock:
                    der_cert = ssock.getpeercert(binary_form=True)
                    version_str = ssock.version()
                    cipher_tuple = ssock.cipher()
                    cipher_name = cipher_tuple[0] if cipher_tuple else "Unknown"
        except Exception as inner_e:
            raise RuntimeError(f"Could not connect via TLS: {str(inner_e)}")
    except Exception as e:
        raise RuntimeError(f"TLS connection failed: {str(e)}")

    if not der_cert:
        raise RuntimeError("No certificate provided by peer.")

    cert = x509.load_der_x509_certificate(der_cert, default_backend())
    
    # Extract SANs
    san_list = []
    try:
        san_ext = cert.extensions.get_extension_for_oid(x509.ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        san_list = [name.value for name in san_ext.value]
    except Exception:
        pass

    # Extract CN
    cn = None
    for attr in cert.subject:
        if attr.oid == x509.NameOID.COMMON_NAME:
            cn = attr.value
            break

    # Extract Issuer
    issuer_org = None
    for attr in cert.issuer:
        if attr.oid == x509.NameOID.ORGANIZATION_NAME:
            issuer_org = attr.value
            break
    if not issuer_org:
        for attr in cert.issuer:
            if attr.oid == x509.NameOID.COMMON_NAME:
                issuer_org = attr.value
                break

    not_before = cert.not_valid_before_utc
    not_after = cert.not_valid_after_utc
    now = datetime.now(timezone.utc)
    days_remaining = (not_after - now).days

    return {
        "hostname": hostname,
        "port": port,
        "common_name": cn,
        "san_list": san_list,
        "issuer": issuer_org or "Unknown Issuer",
        "not_before": not_before.isoformat(),
        "not_after": not_after.isoformat(),
        "days_remaining": days_remaining,
        "is_expired": days_remaining < 0,
        "trusted": trusted,
        "validation_error": validation_error,
        "tls_version": version_str,
        "cipher": cipher_name,
        "serial_number": str(cert.serial_number)
    }


# Helper for TLS checks to reuse connection data
async def get_or_fetch_tls(ctx: ScanContext) -> Optional[Dict[str, Any]]:
    if "tls_data" in ctx.cached_responses:
        return ctx.cached_responses["tls_data"]

    port = ctx.port if ctx.port and ctx.port != 80 else 443
    try:
        tls_info = inspect_tls_certificate(ctx.hostname, port=port, timeout=ctx.timeout_seconds)
        ctx.cached_responses["tls_data"] = tls_info
        return tls_info
    except Exception as e:
        ctx.cached_responses["tls_error"] = str(e)
        return None


# 14. Certificate Expiry
class CertificateExpiryCheck(BaseCheck):
    check_id = "SEC-TLS-014"
    name = "TLS Certificate Expiry"
    category = "Certificate"
    description = "Calculates days until certificate expiration and flags expired or soon-to-expire certificates."
    default_severity = Severity.HIGH
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        tls_info = await get_or_fetch_tls(ctx)
        if not tls_info:
            err = ctx.cached_responses.get("tls_error", "TLS unavailable")
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.SKIPPED if "refused" in err.lower() else CheckStatus.ERROR,
                error_message=err
            )

        days = tls_info["days_remaining"]
        is_expired = tls_info["is_expired"]

        if is_expired:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details=tls_info,
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-EXPIRED",
                        title="TLS Certificate Has Expired",
                        description=f"The certificate expired on {tls_info['not_after']} ({abs(days)} days ago).",
                        severity=Severity.CRITICAL,
                        category=self.category,
                        affected_component=f"{ctx.hostname}:{tls_info['port']}",
                        evidence={"not_after": tls_info["not_after"], "days_remaining": days},
                        risk_explanation="Expired certificates cause browsers to display full-page security warnings, severing encrypted communication for legitimate users and breaking client trust.",
                        remediation="Renew and install an active TLS certificate immediately (e.g. via Let's Encrypt or your certificate authority).",
                        references=["https://cwe.mitre.org/data/definitions/298.html"],
                        cwe_id="CWE-298"
                    )
                ]
            )

        if days <= 7:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details=tls_info,
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-CRITICAL-EXPIRY",
                        title=f"TLS Certificate Expiring in {days} Days",
                        description=f"Certificate expires on {tls_info['not_after']} ({days} days remaining).",
                        severity=Severity.HIGH,
                        category=self.category,
                        affected_component=f"{ctx.hostname}:{tls_info['port']}",
                        evidence={"days_remaining": days, "not_after": tls_info["not_after"]},
                        risk_explanation="Impending expiration will cause service disruption and browser security blocks if not renewed promptly.",
                        remediation="Renew the certificate before expiration.",
                        references=["https://cwe.mitre.org/data/definitions/298.html"],
                        cwe_id="CWE-298"
                    )
                ]
            )

        if days <= 30:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.WARNING,
                details=tls_info,
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-EXPIRING-SOON",
                        title=f"TLS Certificate Renewal Due ({days} Days Remaining)",
                        description=f"Certificate will expire on {tls_info['not_after']}.",
                        severity=Severity.LOW,
                        category=self.category,
                        affected_component=f"{ctx.hostname}:{tls_info['port']}",
                        evidence={"days_remaining": days, "not_after": tls_info["not_after"]},
                        risk_explanation="Routine certificate renewal window has opened.",
                        remediation="Ensure automated ACME renewal (certbot) is executing smoothly.",
                        references=["https://cwe.mitre.org/data/definitions/298.html"],
                        cwe_id="CWE-298"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"days_remaining": days, "expires_at": tls_info["not_after"], "issuer": tls_info["issuer"]}
        )


# 15. Certificate Hostname and Trust
class CertificateHostnameAndTrustCheck(BaseCheck):
    check_id = "SEC-TLS-015"
    name = "Certificate Hostname & Chain Trust"
    category = "Certificate"
    description = "Validates certificate hostname match (SAN/CN) and certificate authority chain trust."
    default_severity = Severity.HIGH
    profiles = ["quick", "standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        tls_info = await get_or_fetch_tls(ctx)
        if not tls_info:
            err = ctx.cached_responses.get("tls_error", "TLS unavailable")
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.SKIPPED if "refused" in err.lower() else CheckStatus.ERROR,
                error_message=err
            )

        findings = []
        hostname = ctx.hostname.lower()
        valid_names = [n.lower() for n in tls_info.get("san_list", [])]
        if tls_info.get("common_name"):
            valid_names.append(tls_info["common_name"].lower())

        # Check hostname match
        def matches_name(h: str, pattern: str) -> bool:
            if pattern == h:
                return True
            if pattern.startswith("*."):
                domain = pattern[2:]
                return h.endswith("." + domain) and h.count(".") == pattern.count(".")
            return False

        name_match = any(matches_name(hostname, p) for p in valid_names)
        if not name_match:
            findings.append(
                FindingDraft(
                    rule_id=f"{self.check_id}-NAME-MISMATCH",
                    title="Certificate Hostname Mismatch",
                    description=f"Host '{hostname}' does not match certificate CN/SANs: {', '.join(valid_names[:5])}.",
                    severity=Severity.HIGH,
                    category=self.category,
                    affected_component=f"{ctx.hostname}:{tls_info['port']}",
                    evidence={"target_hostname": hostname, "san_list": tls_info.get("san_list", [])},
                    risk_explanation="Browsers strictly reject certificates when the requested domain does not match Subject Alternative Names.",
                    remediation="Issue a new certificate including this domain in Subject Alternative Names.",
                    references=["https://cwe.mitre.org/data/definitions/297.html"],
                    cwe_id="CWE-297"
                )
            )

        # Check trust chain
        if not tls_info.get("trusted", True):
            findings.append(
                FindingDraft(
                    rule_id=f"{self.check_id}-UNTRUSTED",
                    title="Untrusted Certificate Authority or Self-Signed Certificate",
                    description=f"Certificate chain could not be verified: {tls_info.get('validation_error', 'Untrusted')}.",
                    severity=Severity.HIGH,
                    category=self.category,
                    affected_component=f"{ctx.hostname}:{tls_info['port']}",
                    evidence={"validation_error": tls_info.get("validation_error")},
                    risk_explanation="Self-signed or untrusted certificates provide no protection against active man-in-the-middle impersonation.",
                    remediation="Install an SSL/TLS certificate signed by a publicly trusted Certificate Authority.",
                    references=["https://cwe.mitre.org/data/definitions/295.html"],
                    cwe_id="CWE-295"
                )
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.FAIL if findings else CheckStatus.PASS,
            details={"trusted": tls_info.get("trusted"), "matched_hostname": name_match, "issuer": tls_info.get("issuer")},
            findings=findings
        )


# 16. TLS Protocol Configuration
class TlsProtocolConfigurationCheck(BaseCheck):
    check_id = "SEC-TLS-016"
    name = "TLS Protocol & Cipher Configuration"
    category = "Transport Security"
    description = "Reports negotiated TLS protocol version and flags deprecated protocols (SSLv3, TLSv1.0, TLSv1.1)."
    default_severity = Severity.HIGH
    profiles = ["standard", "tls_headers"]

    async def run_check(self, ctx: ScanContext) -> CheckResult:
        tls_info = await get_or_fetch_tls(ctx)
        if not tls_info:
            err = ctx.cached_responses.get("tls_error", "TLS unavailable")
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.SKIPPED if "refused" in err.lower() else CheckStatus.ERROR,
                error_message=err
            )

        version = tls_info.get("tls_version", "")
        cipher = tls_info.get("cipher", "")

        deprecated_versions = {"SSLv2", "SSLv3", "TLSv1", "TLSv1.1"}
        if version in deprecated_versions:
            return CheckResult(
                check_id=self.check_id,
                check_name=self.name,
                category=self.category,
                status=CheckStatus.FAIL,
                details={"tls_version": version, "cipher": cipher},
                findings=[
                    FindingDraft(
                        rule_id=f"{self.check_id}-DEPRECATED-PROTOCOL",
                        title=f"Deprecated TLS Protocol Negotiated ({version})",
                        description=f"Server negotiated connection using obsolete {version}.",
                        severity=Severity.HIGH,
                        category=self.category,
                        affected_component=f"{ctx.hostname}:{tls_info['port']}",
                        evidence={"negotiated_version": version, "cipher": cipher},
                        risk_explanation="TLS 1.0 and 1.1 have been officially deprecated by RFC 8996 due to structural cryptographic weaknesses (BEAST, POODLE).",
                        remediation="Configure web server to support only TLS 1.2 and TLS 1.3.",
                        references=["https://datatracker.ietf.org/doc/rfc8996/"],
                        cwe_id="CWE-326"
                    )
                ]
            )

        return CheckResult(
            check_id=self.check_id,
            check_name=self.name,
            category=self.category,
            status=CheckStatus.PASS,
            details={"tls_version": version, "cipher": cipher, "recommended": version in ("TLSv1.2", "TLSv1.3")}
        )
