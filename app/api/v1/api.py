from fastapi import APIRouter
from app.api.v1.endpoints import auth, vehicle, twin, oem, ueba

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(vehicle.router, prefix="/vehicle", tags=["vehicle"])
api_router.include_router(twin.router, prefix="/twin", tags=["twin"])
api_router.include_router(oem.router, prefix="/oem", tags=["oem"])
api_router.include_router(ueba.router, prefix="/ueba", tags=["ueba"])
