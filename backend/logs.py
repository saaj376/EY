from fastapi import APIRouter, Depends
from auth import get_current_role, require_roles
from utils import UserRole
from db import db

router = APIRouter(prefix="/logs", tags=["System Logs"])

@router.get("/workers")
def worker_logs(role=Depends(get_current_role)):
    require_roles(role, [UserRole.OEM_ADMIN])

    return list(
        db.worker_logs.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(100)
    )

@router.get("/notifications")
def notification_logs(role=Depends(get_current_role)):
    require_roles(role, [UserRole.OEM_ADMIN])

    return list(
        db.notification_logs.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(100)
    )
