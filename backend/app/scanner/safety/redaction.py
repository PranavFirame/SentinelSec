import re
from typing import Any, Dict, List, Union

SENSITIVE_HEADER_NAMES = {
    "authorization",
    "proxy-authorization",
    "x-api-key",
    "api-key",
    "x-auth-token",
    "session-token",
    "password",
    "secret"
}

TOKEN_PATTERN = re.compile(r"([a-zA-Z0-9_\-\.]{20,})")


def sanitize_cookie_string(cookie_str: str) -> str:
    """
    Sanitizes cookie values while preserving attribute flags (HttpOnly, Secure, SameSite, Domain, Path).
    Example: 'session_id=s3cr3tv4lu3123456789; Path=/; Secure; HttpOnly' -> 'session_id=[REDACTED]; Path=/; Secure; HttpOnly'
    """
    parts = cookie_str.split(";")
    sanitized_parts = []
    
    for i, part in enumerate(parts):
        part = part.strip()
        if i == 0 and "=" in part:
            name, _ = part.split("=", 1)
            sanitized_parts.append(f"{name}=[REDACTED]")
        else:
            sanitized_parts.append(part)
            
    return "; ".join(sanitized_parts)


def redact_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """
    Redacts sensitive header values.
    """
    redacted = {}
    for key, value in headers.items():
        k_lower = key.lower()
        if k_lower in SENSITIVE_HEADER_NAMES:
            redacted[key] = "[REDACTED_CREDENTIAL]"
        elif k_lower == "set-cookie" or k_lower == "cookie":
            redacted[key] = sanitize_cookie_string(value)
        else:
            # Check for potential bearer tokens or high entropy secrets in arbitrary headers
            if "bearer " in value.lower():
                redacted[key] = "Bearer [REDACTED_TOKEN]"
            else:
                redacted[key] = value
    return redacted


def sanitize_evidence(evidence: Union[Dict[str, Any], List[Any], str, None]) -> Any:
    """
    Recursively redacts sensitive keys and values from an evidence structure.
    """
    if evidence is None:
        return None
    
    if isinstance(evidence, dict):
        sanitized = {}
        for k, v in evidence.items():
            if k.lower() in SENSITIVE_HEADER_NAMES or "password" in k.lower() or "secret" in k.lower() or "token" in k.lower():
                sanitized[k] = "[REDACTED]"
            elif k.lower() in ("headers", "response_headers", "request_headers") and isinstance(v, dict):
                sanitized[k] = redact_headers(v)
            elif isinstance(v, (dict, list)):
                sanitized[k] = sanitize_evidence(v)
            else:
                sanitized[k] = v
        return sanitized

    if isinstance(evidence, list):
        return [sanitize_evidence(item) for item in evidence]

    if isinstance(evidence, str):
        # Prevent leaking long tokens in strings
        if "bearer " in evidence.lower():
            return re.sub(r"bearer\s+[a-zA-Z0-9_\-\.]+", "Bearer [REDACTED]", evidence, flags=re.IGNORECASE)
        return evidence

    return evidence
