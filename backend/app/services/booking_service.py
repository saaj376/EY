from app.connection import get_db
from datetime import datetime
from datetime import timezone

VALID_TRANSITIONS = {
    "PENDING": ["CONFIRMED"], # we cant just go from pending to completed
    "CONFIRMED": ["IN_PROGRESS"], # we have to follow the steps
    "IN_PROGRESS": ["COMPLETED"],
}


def update_booking_status(booking_id: str, new_status: str):
    db = get_db()
    bookings = db["bookings"]

    booking = bookings.find_one({"id": booking_id})
    if not booking:
        raise ValueError("Booking not found")

    current_status = booking["status"]

    if new_status not in VALID_TRANSITIONS.get(current_status, []):
        raise ValueError(
            f"Invalid transition: {current_status} -> {new_status}"
        )

    bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )

    # If service completed -> resolve alert
    if new_status == "COMPLETED":
        _resolve_alert_for_booking(db, booking)

    return new_status


def _resolve_alert_for_booking(db, booking: dict):
    alert_id = booking.get("alert_id")
    if not alert_id:
        return

    db["alerts"].update_one(
        {"id": alert_id},
        {"$set": {"resolved": True}}
    )
