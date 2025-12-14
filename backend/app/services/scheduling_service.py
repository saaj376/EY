from uuid import uuid4
from datetime import datetime, date
from app.connection import get_db
from app.schemas.agent_state import DiagnosisState


def schedule_service(vehicle_id: str,user_id: str | None,diagnosis: DiagnosisState,) -> dict | None:
    """
    Returns booking info or None if no booking needed
    """
    if diagnosis.urgency == "INFO":
        return None

    db = get_db()

    centres = list(db["service_centres"].find())
    today = date.today()

    for centre in centres:
        # check capacity
        bookings_today = db["bookings"].count_documents({
            "service_centre_id": centre["id"],
            "created_at": {
                "$gte": datetime.combine(today, datetime.min.time()),
                "$lte": datetime.combine(today, datetime.max.time()),
            },
            "status": {"$ne": "COMPLETED"},
        })

        if bookings_today >= centre["daily_capacity"]:
            continue  # centre full

        # find avail slot
        slot = db["service_slots"].find_one(
            {
                "service_centre_id": centre["id"],
                "is_available": True,
            },
            sort=[("date", 1), ("start_time", 1)]
        )

        if not slot:
            continue

        # create booking
        booking_id = uuid4().hex

        db["bookings"].insert_one({
            "id": booking_id,
            "vehicle_id": vehicle_id,
            "user_id": user_id,
            "service_centre_id": centre["id"],
            "slot_id": slot["id"],
            "status": "CONFIRMED" if diagnosis.urgency == "CRITICAL" else "PENDING",
            "created_at": datetime.utcnow(),
        })

        # mark slot as booked
        db["service_slots"].update_one(
            {"id": slot["id"]},
            {"$set": {"is_available": False}}
        )

        return {
            "booking_id": booking_id,
            "service_centre": centre["name"],
            "date": slot["start_time"].date(),
            "start_time": slot["start_time"].time(),
        }


    # No centre could handle it
    return None
