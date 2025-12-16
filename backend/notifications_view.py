from fastapi import APIRouter, Depends
from auth import get_current_role, require_roles
from utils import UserRole
from db import db

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/user")
def get_user_notifications(
    user_id: str,
    category: str | None = None,
    status: str | None = None,
    channel: str | None = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])

    query = {"user_id": user_id}
    if category:
        query["category"] = category
    if status:
        query["status"] = status      # SENT / FAILED / QUEUED
    if channel:
        query["channel"] = channel    # SMS

    return list(
        db.notification_logs.find(query, {"_id": 0})
        .sort("timestamp", -1)
    )


@router.get("/service-centre")
def get_service_centre_notifications(
    service_centre_id: str,
    status: str | None = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])

    query = {"service_centre_id": service_centre_id}
    if status:
        query["status"] = status

    return list(
        db.notification_logs.find(query, {"_id": 0})
        .sort("timestamp", -1)
    )


@router.get("/oem/security")
def get_oem_security_notifications(
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

    return list(
        db.notification_logs.find(
            {"category": "SECURITY"},
            {"_id": 0}
        ).sort("timestamp", -1)
    )

@router.get("/oem/all")
def get_all_notifications(
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

    return list(
        db.notification_logs.find({}, {"_id": 0})
        .sort("timestamp", -1)
    )

@router.get("/oem/sms")
def get_sms_notifications(
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

    return list(
        db.notification_logs.find(
            {"channel": "SMS"},
            {"_id": 0}
        ).sort("timestamp", -1)
    )
