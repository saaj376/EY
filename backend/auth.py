from fastapi import Header, HTTPException
from utils import UserRole
import bcrypt

def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def get_current_role(x_role: str = Header(...)):
    try:
        return UserRole(x_role)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid role")

def require_roles(current_role: UserRole, allowed: list[UserRole]):
    if current_role not in allowed:
        raise HTTPException(status_code=403, detail="Access denied")
