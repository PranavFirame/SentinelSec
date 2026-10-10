import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class CheckExecution(Base):
    __tablename__ = "check_executions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    check_id = Column(String(64), nullable=False, index=True)
    check_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)  # pass, fail, warning, skipped, error
    
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    
    result_details = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    scan = relationship("Scan", back_populates="check_executions")
