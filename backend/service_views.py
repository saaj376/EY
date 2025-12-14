from fastapi import APIRouter, Depends
from auth import get_current_role, require_roles
from utils import UserRole
from db import db

router = APIRouter(prefix="/service", tags=["Service Centre Views"])

@router.get("/bookings")
def get_my_bookings(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])
    
    if db is None:
        return []

    bookings = list(db.bookings.find({"service_centre_id": service_centre_id}))
    # Convert MongoDB _id to booking_id for frontend compatibility
    for booking in bookings:
        if "_id" in booking:
            booking["booking_id"] = str(booking["_id"])
            del booking["_id"]
    return bookings

@router.get("/jobs")
def get_my_jobs(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])
    
    if db is None:
        return []

    bookings = db.bookings.find(
        {"service_centre_id": service_centre_id},
        {"_id": 1}
    )

    booking_ids = [b["_id"] for b in bookings]

    jobs = list(db.job_cards.find({"booking_id": {"$in": booking_ids}}))
    # Convert MongoDB _id to job_card_id for frontend compatibility
    for job in jobs:
        if "_id" in job:
            job["job_card_id"] = str(job["_id"])
            del job["_id"]
    return jobs

@router.get("/alerts")
def get_related_alerts(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])
    
    if db is None:
        return []

    vehicle_ids = db.bookings.distinct(
        "vehicle_id",
        {"service_centre_id": service_centre_id}
    )

    return list(db.alerts.find(
        {"vehicle_id": {"$in": vehicle_ids}},
        {"_id": 0}
    ))

@router.get("/capa")
def get_assigned_capa(
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])
    
    if db is None:
        return []

    return list(db.capa_actions.find(
        {"owner_team": "Service"},
        {"_id": 0}
    ))


@router.get("/booking/timeline")
def get_booking_timeline(
    booking_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if db is None:
        return {"status_timeline": []}

    booking = db.bookings.find_one(
        {"_id": booking_id},
        {"status_timeline": 1, "_id": 0}
    )
    return booking or {"status_timeline": []}


@router.get("/notifications")
def get_my_notifications(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])
    
    if db is None:
        return []

    return list(db.notification_logs.find(
        {"service_centre_id": service_centre_id},
        {"_id": 0}
    ).sort("timestamp", -1))
