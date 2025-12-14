from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional
from enum import Enum
from datetime import datetime
from typing_extensions import Annotated

# Helper for ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class AlertType(str, Enum):
    MAINTENANCE = "MAINTENANCE"
    SECURITY = "SECURITY"
    SYSTEM = "SYSTEM"

class AlertStatus(str, Enum):
    NEW = "NEW"
    READ = "READ"
    RESOLVED = "RESOLVED"

class AlertBase(BaseModel):
    vehicle_id: Optional[str] = None
    message: str
    type: AlertType = AlertType.SYSTEM

class AlertCreate(AlertBase):
    user_id: str

class AlertInDB(AlertBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    status: AlertStatus = AlertStatus.NEW
    response: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class AlertResponse(AlertBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    status: AlertStatus
    response: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
