from fastapi import Header, HTTPException
from utils import UserRole

def get_current_role(x_role: str = Header(...)):
    try:
        return UserRole(x_role)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid role")

def require_roles(current_role: UserRole, allowed: list[UserRole]):
    if current_role not in allowed:
        raise HTTPException(status_code=403, detail="Access denied")
