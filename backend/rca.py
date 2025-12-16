from db import db
from datetime import datetime
from auth import require_roles
from utils import UserRole

rca_col = db.rca


def create_rca(alert_id, vehicle_id, root_cause, method, current_role):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    rca = {
        "alert_id": alert_id,
        "vehicle_id": vehicle_id,
        "root_cause": root_cause,
        "analysis_method": method,   # 5_WHYS / FMEA
        "status": "OPEN",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return rca_col.insert_one(rca).inserted_id


def update_rca_status(rca_id, status, current_role):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    rca_col.update_one(
        {"_id": rca_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
