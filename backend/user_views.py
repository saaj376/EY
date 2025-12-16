from fastapi import APIRouter, Depends
from auth import get_current_role, require_roles
from utils import UserRole
from db import db

router = APIRouter(prefix="/user", tags=["User Views"])

@router.get("/vehicles")
def get_my_vehicles(
    user_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])
    
    if db is None:
        return []

    return list(db.vehicles.find(
        {"owner_user_id": user_id},
        {"_id": 0}
    ))
@router.get("/alerts")
def get_my_alerts(
    user_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])
    
    if db is None:
        return []

    vehicle_ids = db.vehicles.distinct(
        "_id",
        {"owner_user_id": user_id}
    )

    return list(db.alerts.find(
        {"vehicle_id": {"$in": vehicle_ids}},
        {"_id": 0}
    ))


@router.get("/diagnosis")
def get_my_diagnosis(
    user_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])
    
    if db is None:
        return []

    vehicle_ids = db.vehicles.distinct(
        "_id",
        {"owner_user_id": user_id}
    )

    alert_ids = db.alerts.distinct(
        "_id",
        {"vehicle_id": {"$in": vehicle_ids}}
    )

    return list(db.diagnosis.find(
        {"alert_id": {"$in": alert_ids}},
        {"_id": 0}
    ))

@router.get("/bookings")
def get_my_bookings(
    user_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])
    
    if db is None:
        return []

    bookings = list(db.bookings.find({"user_id": user_id}))
    # Convert MongoDB _id to booking_id for frontend compatibility
    for booking in bookings:
        if "_id" in booking:
            booking["booking_id"] = str(booking["_id"])
            del booking["_id"]
    return bookings
@router.get("/jobs")
def get_my_jobs(
    user_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])
    
    if db is None:
        return []

    bookings = db.bookings.find(
        {"user_id": user_id},
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
@router.get("/invoices")
def get_my_invoices(
    user_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER])
    
    if db is None:
        return []

    bookings = db.bookings.find(
        {"user_id": user_id},
        {"_id": 1}
    )
    booking_ids = [b["_id"] for b in bookings]

    job_ids = db.job_cards.distinct(
        "_id",
        {"booking_id": {"$in": booking_ids}}
    )

    invoices = list(db.invoices.find({"job_card_id": {"$in": job_ids}}))
    # Convert MongoDB _id to invoice_id for frontend compatibility
    for invoice in invoices:
        if "_id" in invoice:
            invoice["invoice_id"] = str(invoice["_id"])
            del invoice["_id"]
    return invoices
