from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models.user import UserResponse, UserRole
from app.models.vehicle import VehicleCreate, VehicleResponse, VehicleInDB
from app.utils.security import get_current_user_token
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/customer", tags=["Customer"])

async def get_current_customer(current_user: dict = Depends(get_current_user_token)):
    if current_user["role"] != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/vehicles", response_model=List[VehicleResponse])
async def get_my_vehicles(current_user: dict = Depends(get_current_customer)):
    db = await get_database()
    vehicles = await db.vehicles.find({"owner_user_id": current_user["id"]}).to_list(length=100)
    return vehicles

@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def register_my_vehicle(vehicle: VehicleCreate, current_user: dict = Depends(get_current_customer)):
    db = await get_database()
    existing_vehicle = await db.vehicles.find_one({"vin": vehicle.vin})
    if existing_vehicle:
        raise HTTPException(status_code=400, detail="Vehicle with this VIN already exists")

    vehicle_in_db = VehicleInDB(
        **vehicle.dict(),
        owner_user_id=current_user["id"]
    )
    new_vehicle = await db.vehicles.insert_one(vehicle_in_db.dict(by_alias=True, exclude={"id"}))
    created_vehicle = await db.vehicles.find_one({"_id": new_vehicle.inserted_id})
    return created_vehicle

# Placeholders for other customer actions
@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_customer)):
    return {"message": "Alerts endpoint placeholder"}

@router.get("/bookings")
async def get_bookings(current_user: dict = Depends(get_current_customer)):
    return {"message": "Bookings endpoint placeholder"}

@router.post("/bookservice")
async def book_service(current_user: dict = Depends(get_current_customer)):
    return {"message": "Book Service endpoint placeholder"}

@router.post("/respond")
async def respond_to_alert(current_user: dict = Depends(get_current_customer)):
    return {"message": "Respond to Alert endpoint placeholder"}
