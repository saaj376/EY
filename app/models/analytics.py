from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional
from datetime import datetime, date
from typing_extensions import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class ComponentFailure(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    vehicle_id: PyObjectId
    component: str
    count: int
    last_failure_at: datetime

    class Config:
        populate_by_name = True

class OEMMetricsDaily(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    date: date
    model: str
    failures: int
    avg_severity: float

    class Config:
        populate_by_name = True

class UEBAEvent(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    action: str
    ip_address: str
    device: str
    timestamp: datetime
    risk_score: float
    flagged: bool

    class Config:
        populate_by_name = True
