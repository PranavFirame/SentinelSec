import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target = Column(String(512), nullable=False, index=True)
    profile = Column(String(64), nullable=False, default="standard")
    status = Column(String(32), nullable=False, default="queued", index=True)  # queued, running, completed, failed, cancelled
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    security_score = Column(Integer, nullable=True)  # 0 to 100
    score_breakdown = Column(JSON, nullable=True)
    
    checks_executed = Column(Integer, default=0, nullable=False)
    checks_passed = Column(Integer, default=0, nullable=False)
    checks_failed = Column(Integer, default=0, nullable=False)
    checks_skipped = Column(Integer, default=0, nullable=False)
    checks_errored = Column(Integer, default=0, nullable=False)
    
    target_ip = Column(String(64), nullable=True)
    error_summary = Column(Text, nullable=True)

    # Multi-tenant user ownership
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    owner = relationship("User", back_populates="scans")

    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan", lazy="selectin")
    check_executions = relationship("CheckExecution", back_populates="scan", cascade="all, delete-orphan", lazy="selectin")
