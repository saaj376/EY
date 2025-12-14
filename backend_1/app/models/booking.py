from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional
from enum import Enum
from datetime import datetime
from typing_extensions import Annotated

# Helper for ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class BookingBase(BaseModel):
    vehicle_id: str
    service_type: str
    booking_date: datetime
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingInDB(BookingBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    status: BookingStatus = BookingStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class BookingResponse(BookingBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    status: BookingStatus
    created_at: datetime

    class Config:
        populate_by_name = True
