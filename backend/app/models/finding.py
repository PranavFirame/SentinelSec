import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(128), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False, index=True)  # critical, high, medium, low, informational
    category = Column(String(64), nullable=False, index=True)
    confidence = Column(String(32), nullable=False, default="high")  # high, medium, low
    status = Column(String(32), nullable=False, default="open", index=True)  # open, resolved, accepted_risk
    
    affected_component = Column(String(256), nullable=False)
    evidence = Column(JSON, nullable=True)  # structured, redacted evidence
    risk_explanation = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    references = Column(JSON, nullable=True)  # list of URLs/docs
    cwe_id = Column(String(64), nullable=True)
    
    first_observed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_observed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    scan = relationship("Scan", back_populates="findings")
