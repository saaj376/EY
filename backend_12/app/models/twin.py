from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List
from datetime import datetime
from typing_extensions import Annotated
from enum import Enum

PyObjectId = Annotated[str, BeforeValidator(str)]

class Severity(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"

class TwinStateBase(BaseModel):
    vehicle_id: PyObjectId
    speed: float
    rpm: float
    engine_temp: float
    battery_level: float
    brake_wear: float
    driver_score: float
    severity: Severity
    predicted_issues: List[str] = []

class TwinStateCreate(TwinStateBase):
    pass

class TwinStateInDB(TwinStateBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class TwinStateResponse(TwinStateBase):
    updated_at: datetime

    class Config:
        populate_by_name = True
