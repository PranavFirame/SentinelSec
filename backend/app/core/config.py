from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelSec"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./sentinelsec.db"
    
    # Scanner Security Policies & SSRF Protection
    ALLOW_LOCAL_TARGETS: bool = Field(
        default=False,
        description="Allow scans against localhost/private networks for local testing/demo only"
    )
    MAX_SCAN_TIMEOUT_SECONDS: int = 30
    DEFAULT_TIMEOUT_SECONDS: int = 10
    MAX_REDIRECTS: int = 5
    MAX_CONCURRENT_SCANS: int = 4
    MAX_RESPONSE_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB max response
    ALLOWED_PORTS: List[int] = [80, 443, 8080, 8443]
    
    # Vulnerability Feeds
    OSV_API_URL: str = "https://api.osv.dev/v1"
    OSV_CACHE_TTL_SECONDS: int = 3600
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
