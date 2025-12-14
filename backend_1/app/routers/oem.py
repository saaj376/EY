from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.user import UserRole
from app.models.analytics import ComponentFailure, UEBAEvent
from app.utils.security import get_current_user_token
from app.database import get_database

router = APIRouter(prefix="/oem", tags=["OEM Analytics"])

async def get_oem_admin(current_user: dict = Depends(get_current_user_token)):
    if current_user["role"] != UserRole.OEM_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/analytics", response_model=List[ComponentFailure])
async def get_analytics(current_user: dict = Depends(get_oem_admin)):
    db = await get_database()
    # Just returning component failures as a sample of analytics
    failures = await db.component_failures.find().to_list(length=100)
    return failures

@router.get("/ueba", response_model=List[UEBAEvent])
async def get_ueba(current_user: dict = Depends(get_oem_admin)):
    db = await get_database()
    events = await db.ueba_events.find().to_list(length=100)
    return events
