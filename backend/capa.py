from db import db
from datetime import datetime
from auth import require_roles
from utils import UserRole

capa_col = db.capa_actions


def create_capa(rca_id, action_type, description, owner_team, target_date, current_role):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    capa = {
        "rca_id": rca_id,
        "action_type": action_type,   # CORRECTIVE / PREVENTIVE
        "description": description,
        "owner_team": owner_team,
        "status": "PENDING",
        "target_date": target_date,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return capa_col.insert_one(capa).inserted_id


def update_capa_status(capa_id, status, current_role):
    require_roles(current_role, [UserRole.OEM_ADMIN, UserRole.SERVICE_CENTER])

    capa_col.update_one(
        {"_id": capa_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
