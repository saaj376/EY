from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UEBAEventBase(BaseModel):
    action: str
    ip_address: str
    risk_score: float = 0.0
    details: Optional[str] = None

class UEBAEventCreate(UEBAEventBase):
    pass

class UEBAEventResponse(UEBAEventBase):
    id: int
    user_id: Optional[int]
    timestamp: datetime

    class Config:
        from_attributes = True
