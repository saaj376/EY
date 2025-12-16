from db import db
from datetime import datetime
from auth import require_roles
from utils import UserRole

jobs_col = db.job_cards


def create_job_card(booking_id, notes, current_role):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    job = {
        "booking_id": booking_id,
        "technician_notes": notes,
        "status": "OPEN",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return jobs_col.insert_one(job).inserted_id


def update_job_status(job_id, status, notes, current_role):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    jobs_col.update_one(
        {"_id": job_id},
        {
            "$set": {
                "status": status,
                "technician_notes": notes,
                "updated_at": datetime.utcnow()
            }
        }
    )
