from typing import List, Union, Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelSec"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./sentinelsec.db"
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_postgres_scheme(cls, v: Any) -> str:
        if isinstance(v, str):
            s = v.strip()
            # Render/Heroku provide postgres:// but SQLAlchemy 2.0 requires postgresql:// or postgresql+psycopg2://
            if s.startswith("postgres://"):
                return s.replace("postgres://", "postgresql+psycopg2://", 1)
            elif s.startswith("postgresql://") and not s.startswith("postgresql+"):
                return s.replace("postgresql://", "postgresql+psycopg2://", 1)
            return s
        return v
    
    # Authentication & Security

    SECRET_KEY: str = Field(default="sentinelsec-dev-insecure-secret-key-32charsmin!", description="JWT signing secret")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    SESSION_COOKIE_NAME: str = "sentinelsec_session"
    COOKIE_SECURE: bool = False  # Set True in production over HTTPS
    COOKIE_SAMESITE: str = "lax"
    
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
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sentinelsec-frontend-rzim.onrender.com",
        "*"
    ]


    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "*"
        ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
