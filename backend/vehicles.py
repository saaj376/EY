from db import vehicles_col
from datetime import datetime
from utils import UserRole
from auth import require_roles

def register_vehicle(vin, owner_user_id, make, model, year, current_role: UserRole):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    vehicle = {
        "vin": vin,
        "owner_user_id": owner_user_id,
        "make": make,
        "model": model,
        "year": year,
        "created_at": datetime.utcnow(),
        "last_seen_at": datetime.utcnow()
    }
    return vehicles_col.insert_one(vehicle).inserted_id
