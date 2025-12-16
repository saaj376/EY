from db import users_col
from datetime import datetime
from utils import UserRole
from auth import require_roles

def create_user(name, email, role, current_role: UserRole):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    user = {
        "name": name,
        "email": email,
        "password_hash": "hashed",
        "role": role,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return users_col.insert_one(user).inserted_id
