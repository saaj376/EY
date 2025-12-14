from app.utils.connection import get_db
from datetime import datetime
from datetime import timezone
from uuid import uuid4

VALID_TRANSITIONS = {
    "PENDING": ["CONFIRMED"], # we cant just go from pending to completed
    "CONFIRMED": ["IN_PROGRESS"], # we have to follow the steps
    "IN_PROGRESS": ["COMPLETED"],
}


async def create_customer_booking(
    vehicle_id: str,
    user_id: str,
):
    db = await get_db()

    # 1️⃣ Check slot availability (simplified)
    slot = await db["service_slots"].find_one({"is_available": True})

    booking_id = uuid4().hex

    booking_doc = {
        "id": booking_id,
        "vehicle_id": vehicle_id,
        "user_id": user_id,
        "status": "PENDING",  # always start safe
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    # 2️⃣ If slot exists → auto-confirm
    if slot:
        booking_doc["service_centre_id"] = slot["service_centre_id"]
        booking_doc["slot_id"] = slot["id"]

        db["service_slots"].update_one(
            {"id": slot["id"]},
            {"$set": {"is_available": False}}
        )

        booking_doc["status"] = "CONFIRMED"

    # 3️⃣ Insert booking
    db["bookings"].insert_one(booking_doc)

    return booking_doc

async def update_booking_status(booking_id: str, new_status: str , remarks : str | None = None):
    db = await get_db()
    bookings = db["bookings"]

    booking = bookings.find_one({"id": booking_id})
    if not booking:
        raise ValueError("Booking not found")

    current_status = booking["status"]

    if new_status not in VALID_TRANSITIONS.get(current_status, []):
        raise ValueError(
            f"Invalid transition: {current_status} -> {new_status}"
        )

    update_fields = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }

    if remarks:
        update_fields["remarks"] = remarks

    bookings.update_one(
        {"id": booking_id},
        {"$set": update_fields}
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
