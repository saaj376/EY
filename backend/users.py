from fastapi import HTTPException
from db import users_col
from datetime import datetime
from utils import UserRole
from auth import require_roles, get_password_hash

def create_user(name, email, password, role, current_role: UserRole = None, check_role: bool = True):
    if check_role:
        if not current_role:
             raise HTTPException(status_code=401, detail="Authentication required")
        require_roles(current_role, [UserRole.OEM_ADMIN])

    user = {
        "name": name,
        "email": email,
        "password_hash": get_password_hash(password),
        "role": role,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return users_col.insert_one(user).inserted_id
