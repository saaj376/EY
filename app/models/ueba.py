from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class UEBAEvent(Base):
    __tablename__ = "ueba_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable if we track unauthenticated attempts? Let's say yes for now or just logged in users.
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    risk_score = Column(Float, default=0.0)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
