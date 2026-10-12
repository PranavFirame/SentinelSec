import socket
import ipaddress
from urllib.parse import urlparse
from typing import Tuple, List, Optional
from backend.app.core.config import settings


class SSRFValidationError(Exception):
    """Raised when target URL violates SSRF safety constraints."""
    pass


BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254",
    "local",
    "broadcasthost"
}

CLOUD_METADATA_IPS = {
    ipaddress.ip_address("169.254.169.254"),
    ipaddress.ip_address("fd00:ec2::254") if hasattr(ipaddress, "IPv6Address") else None,
}


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address, allow_local: bool = False) -> Tuple[bool, str]:
    """
    Checks if an IP address belongs to blocked networks (private, loopback, multicast, link-local, metadata).
    """
    if ip in CLOUD_METADATA_IPS:
        return True, "Cloud instance metadata service address is strictly prohibited."

    if allow_local:
        # In explicit local development mode, loopback/private IPs are permitted, but cloud metadata is still blocked
        return False, "Local IPs allowed by configuration."

    if ip.is_loopback:
        return True, "Loopback addresses (127.0.0.0/8, ::1) are prohibited."
    
    if ip.is_private:
        return True, "Private/internal RFC 1918 and ULA addresses are prohibited."
    
    if ip.is_link_local:
        return True, "Link-local addresses (169.254.0.0/16, fe80::/10) are prohibited."
    
    if ip.is_multicast:
        return True, "Multicast addresses are prohibited."
    
    # Well-Known NAT64 Prefix (64:ff9b::/96 - RFC 6052) translates to public IPv4 internet addresses.
    # Python ipaddress marks 64:ff9b::/96 as is_reserved=True, but it is globally routable via DNS64/NAT64.
    nat64_wkp = ipaddress.ip_network("64:ff9b::/96")
    if isinstance(ip, ipaddress.IPv6Address) and ip in nat64_wkp:
        # Extract embedded IPv4 and check if that IPv4 is blocked
        embedded_ipv4 = ipaddress.IPv4Address(ip.packed[-4:])
        return is_ip_blocked(embedded_ipv4, allow_local=allow_local)

    if ip.is_reserved:
        return True, "Reserved IP space is prohibited."
        
    if ip.is_unspecified:
        return True, "Unspecified addresses (0.0.0.0, ::) are prohibited."

    # Carrier-grade NAT 100.64.0.0/10
    if isinstance(ip, ipaddress.IPv4Address):
        cgnat = ipaddress.ip_network("100.64.0.0/10")
        if ip in cgnat:
            return True, "Shared address space (Carrier-Grade NAT) is prohibited."

    return False, "IP is public and routable."


def validate_target_url(target_url: str, allow_local: Optional[bool] = None) -> Tuple[str, str, int]:
    """
    Validates a target URL against SSRF rules.
    Returns (normalized_url, resolved_ip, port).
    Throws SSRFValidationError if unsafe.
    """
    if not target_url or not isinstance(target_url, str):
        raise SSRFValidationError("Target URL must be a non-empty string.")

    target_url = target_url.strip()
    
    # Check scheme: if no scheme provided (e.g. "example.com"), default to https
    parsed = urlparse(target_url)
    if not parsed.scheme:
        target_url = "https://" + target_url
        parsed = urlparse(target_url)

    # 1. Scheme check
    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFValidationError(f"Unsupported scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFValidationError("Invalid target: missing hostname.")

    hostname_lower = hostname.lower()

    if allow_local is None:
        allow_local = settings.ALLOW_LOCAL_TARGETS

    # 2. Block known sensitive hostnames
    if not allow_local and hostname_lower in BLOCKED_HOSTNAMES:
        raise SSRFValidationError(f"Hostname '{hostname}' is reserved/internal and cannot be scanned.")

    # 3. Port check
    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80

    if port not in settings.ALLOWED_PORTS:
        raise SSRFValidationError(f"Port {port} is not in the allowed scanner port list ({settings.ALLOWED_PORTS}).")

    # 4. Resolve DNS & Check all resolved IPs (protect against DNS rebinding / internal routing)
    try:
        addr_info = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
        if not addr_info:
            raise SSRFValidationError(f"Could not resolve host '{hostname}'.")
    except socket.gaierror as e:
        raise SSRFValidationError(f"DNS resolution failed for '{hostname}': {str(e)}")

    resolved_ips: List[ipaddress.IPv4Address | ipaddress.IPv6Address] = []
    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            resolved_ips.append(ip_obj)
        except ValueError:
            continue

    if not resolved_ips:
        raise SSRFValidationError(f"No valid IP addresses resolved for '{hostname}'.")

    # Verify all resolved IPs
    primary_ip = str(resolved_ips[0])
    for ip in resolved_ips:
        blocked, reason = is_ip_blocked(ip, allow_local=allow_local)
        if blocked:
            raise SSRFValidationError(f"Target '{hostname}' resolves to restricted IP {ip}: {reason}")

    # Normalized URL
    path_and_query = parsed.path if parsed.path else "/"
    if parsed.query:
        path_and_query += f"?{parsed.query}"
    
    port_str = f":{port}" if (parsed.scheme == "http" and port != 80) or (parsed.scheme == "https" and port != 443) else ""
    normalized_url = f"{parsed.scheme}://{hostname_lower}{port_str}{path_and_query}"

    return normalized_url, primary_ip, port
