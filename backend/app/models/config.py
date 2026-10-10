from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from backend.app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class AppConfig(Base):
    __tablename__ = "app_config"

    key = Column(String(128), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
