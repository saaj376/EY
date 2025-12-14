from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional
from datetime import datetime
from typing_extensions import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class VehicleBase(BaseModel):
    vin: str
    make: str
    model: str
    year: int

class VehicleCreate(VehicleBase):
    pass

class VehicleInDB(VehicleBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    owner_user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class VehicleResponse(VehicleBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    owner_user_id: str
    created_at: datetime
    last_seen_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
