from typing import Dict, List, Type, Any
from backend.app.scanner.checks.base import BaseCheck
from backend.app.scanner.checks.http_checks import (
    HttpsAvailabilityCheck,
    HttpToHttpsRedirectCheck,
    ContentSecurityPolicyCheck,
    StrictTransportSecurityCheck,
    XContentTypeOptionsCheck,
    FrameProtectionCheck,
    ReferrerPolicyCheck,
    PermissionsPolicyCheck,
    CorsConfigurationCheck,
    CookieSecurityCheck,
    InformationDisclosureCheck,
    DirectoryListingCheck,
    SensitivePathExposureCheck,
)
from backend.app.scanner.checks.tls_checks import (
    CertificateExpiryCheck,
    CertificateHostnameAndTrustCheck,
    TlsProtocolConfigurationCheck,
)

ALL_CHECKS: List[Type[BaseCheck]] = [
    HttpsAvailabilityCheck,
    HttpToHttpsRedirectCheck,
    ContentSecurityPolicyCheck,
    StrictTransportSecurityCheck,
    XContentTypeOptionsCheck,
    FrameProtectionCheck,
    ReferrerPolicyCheck,
    PermissionsPolicyCheck,
    CorsConfigurationCheck,
    CookieSecurityCheck,
    InformationDisclosureCheck,
    DirectoryListingCheck,
    SensitivePathExposureCheck,
    CertificateExpiryCheck,
    CertificateHostnameAndTrustCheck,
    TlsProtocolConfigurationCheck,
]

CHECK_REGISTRY: Dict[str, Type[BaseCheck]] = {c.check_id: c for c in ALL_CHECKS}


def get_checks_for_profile(profile: str) -> List[BaseCheck]:
    """
    Returns instantiated checks enabled for a given assessment profile.
    Profiles:
      - quick: fast triage of essential HTTPS, TLS, basic headers
      - standard: all 16 web security checks
      - tls_headers: TLS certificates + HTTP security headers
      - dependency: manifest only (handled by dependency scanner)
    """
    if profile == "standard":
        return [c() for c in ALL_CHECKS]
    
    selected = [c() for c in ALL_CHECKS if profile in c.profiles]
    return selected if selected else [c() for c in ALL_CHECKS]


def get_check_definitions() -> List[Dict[str, Any]]:
    return [
        {
            "id": c.check_id,
            "name": c.name,
            "category": c.category,
            "description": c.description,
            "default_severity": c.default_severity.value,
            "profiles": c.profiles,
            "is_network_check": c.is_network_check
        }
        for c in ALL_CHECKS
    ]
