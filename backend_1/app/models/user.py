from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import Optional
from enum import Enum
from datetime import datetime
from typing_extensions import Annotated

# Helper for ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    SERVICE_CENTER = "SERVICE_CENTER"
    OEM_ADMIN = "OEM_ADMIN"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime

    class Config:
        populate_by_name = True
