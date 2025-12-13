from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VehicleBase(BaseModel):
    vin: str
    make: str
    model: str
    year: int

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
