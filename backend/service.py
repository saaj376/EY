from db import db
from datetime import datetime, timedelta
from auth import require_roles
from utils import UserRole
from notifications import notify_service_centre

service_centres_col = db.service_centres
bookings_col = db.bookings


def create_service_centre(name, location, contact, current_role, max_capacity=5):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    centre = {
        "name": name,
        "location": location,
        "contact": contact,
        "max_capacity": max_capacity,
        "working_hours": {
            "start": "09:00",
            "end": "18:00"
        },
        "slot_duration_minutes": 60,  # 1 hour slots
        "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    }
    return service_centres_col.insert_one(centre).inserted_id


def generate_available_slots(service_centre_id, date):
    """Generate available time slots for a specific date at a service centre"""
    centre = service_centres_col.find_one({"_id": service_centre_id})
    if not centre:
        raise ValueError("Service centre not found")
    
    max_capacity = centre.get("max_capacity", 5)
    slot_duration = centre.get("slot_duration_minutes", 60)
    working_hours = centre.get("working_hours", {"start": "09:00", "end": "18:00"})
    
    # Parse date and generate slots
    from datetime import datetime as dt
    if isinstance(date, str):
        date = dt.fromisoformat(date.split('T')[0])
    
    # Check if it's a working day
    day_name = date.strftime("%A")
    working_days = centre.get("working_days", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    if day_name not in working_days:
        return []
    
    # Generate time slots
    start_hour, start_min = map(int, working_hours["start"].split(":"))
    end_hour, end_min = map(int, working_hours["end"].split(":"))
    
    slots = []
    current_time = dt.combine(date, dt.min.time()).replace(hour=start_hour, minute=start_min)
    end_time = dt.combine(date, dt.min.time()).replace(hour=end_hour, minute=end_min)
    
    while current_time < end_time:
        slot_end = current_time + timedelta(minutes=slot_duration)
        
        # Check current bookings for this slot
        booked_count = bookings_col.count_documents({
            "service_centre_id": service_centre_id,
            "status": {"$ne": "CANCELLED"},
            "slot_start": current_time.isoformat(),
        })
        
        available_count = max_capacity - booked_count
        
        slots.append({
            "start": current_time.isoformat(),
            "end": slot_end.isoformat(),
            "available_slots": available_count,
            "is_available": available_count > 0
        })
        
        current_time = slot_end
    
    return slots


def get_available_service_centres_with_slots(date, user_location=None):
    """Get all service centres with their available slots for a given date"""
    all_centres = list(service_centres_col.find({}))
    centres_with_slots = []
    
    for centre in all_centres:
        centre_id = centre["_id"]
        slots = generate_available_slots(centre_id, date)
        
        # Only include centres that have at least one available slot
        available_slots = [s for s in slots if s["is_available"]]
        
        if available_slots:
            centres_with_slots.append({
                "service_centre_id": str(centre_id),
                "name": centre.get("name"),
                "location": centre.get("location"),
                "contact": centre.get("contact"),
                "available_slots": available_slots,
                "total_available": len(available_slots)
            })
    
    return centres_with_slots


def create_booking(
    vehicle_id,
    user_id,
    service_centre_id,
    slot_start,
    slot_end,
    current_role
):
    require_roles(current_role, [UserRole.CUSTOMER, UserRole.OEM_ADMIN])

    # Validate that this slot exists and is available
    centre = service_centres_col.find_one({"_id": service_centre_id})
    if not centre:
        raise ValueError("Service centre not found")
    
    max_capacity = centre.get("max_capacity", 5)
    
    # Check how many bookings already exist for this exact slot
    existing_count = bookings_col.count_documents({
        "service_centre_id": service_centre_id,
        "status": {"$ne": "CANCELLED"},
        "slot_start": slot_start,
    })
    
    if existing_count >= max_capacity:
        # Get alternative service centres for this date
        from datetime import datetime as dt
        date = dt.fromisoformat(slot_start.split('T')[0])
        alternatives = get_available_service_centres_with_slots(date)
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Service centre is at full capacity for this time slot",
                "service_centre_id": str(service_centre_id),
                "requested_slot": {"start": slot_start, "end": slot_end},
                "available_alternatives": alternatives
            }
        )

    booking = {
        "vehicle_id": vehicle_id,
        "user_id": user_id,
        "service_centre_id": service_centre_id,
        "slot_start": slot_start,
        "slot_end": slot_end,
        "status": "CONFIRMED",
        "status_timeline": [
            {
                "status": "CONFIRMED",
                "timestamp": datetime.utcnow()
            }
        ],
        "created_at": datetime.utcnow()
    }
    
    booking_id = bookings_col.insert_one(booking).inserted_id
    
    # Notify service centre
    notify_service_centre(
        service_centre_id=service_centre_id,
        message=f"New booking confirmed for {slot_start}",
        channel="SMS"
    )
    
    return booking_id


def update_booking_status(booking_id, status, current_role):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    bookings_col.update_one(
        {"_id": booking_id},
        {
            "$set": {"status": status},
            "$push": {
                "status_timeline": {
                    "status": status,
                    "timestamp": datetime.utcnow()
                }
            }
        }
    )


def cancel_booking(booking_id, reason, current_role):
    require_roles(current_role, [UserRole.CUSTOMER, UserRole.OEM_ADMIN])

    booking = bookings_col.find_one({"_id": booking_id})
    if not booking:
        raise ValueError("Booking not found")

    bookings_col.update_one(
        {"_id": booking_id},
        {
            "$set": {
                "status": "CANCELLED",
                "cancel_reason": reason
            },
            "$push": {
                "status_timeline": {
                    "status": "CANCELLED",
                    "timestamp": datetime.utcnow(),
                    "reason": reason
                }
            }
        }
    )
    
    notify_service_centre(
        service_centre_id=booking["service_centre_id"],
        message=f"Booking {booking_id} has been cancelled. Reason: {reason}",
        channel="SMS"
    )