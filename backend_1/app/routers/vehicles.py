from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models.user import UserRole
from app.models.vehicle import VehicleCreate, VehicleResponse, VehicleInDB
from app.utils.security import get_current_user_token
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/vehicles", tags=["Vehicle Management"])

async def get_privileged_user(current_user: dict = Depends(get_current_user_token)):
    if current_user["role"] not in [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def register_vehicle(vehicle: VehicleCreate, owner_email: str, current_user: dict = Depends(get_privileged_user)):
    db = await get_database()
    
    # Verify owner exists
    owner = await db.users.find_one({"email": owner_email})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner email not found")

    existing_vehicle = await db.vehicles.find_one({"vin": vehicle.vin})
    if existing_vehicle:
        raise HTTPException(status_code=400, detail="Vehicle with this VIN already exists")

    vehicle_in_db = VehicleInDB(
        **vehicle.dict(),
        owner_user_id=str(owner["_id"])
    )
    new_vehicle = await db.vehicles.insert_one(vehicle_in_db.dict(by_alias=True, exclude={"id"}))
    created_vehicle = await db.vehicles.find_one({"_id": new_vehicle.inserted_id})
    return created_vehicle

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_privileged_user)):
    db = await get_database()
    try:
        oid = ObjectId(vehicle_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID")
        
    vehicle = await db.vehicles.find_one({"_id": oid})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: str, vehicle_update: VehicleCreate, current_user: dict = Depends(get_privileged_user)):
    db = await get_database()
    try:
        oid = ObjectId(vehicle_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID")

    # Check if vehicle exists
    existing = await db.vehicles.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = vehicle_update.dict(exclude_unset=True)
    # Don't allow changing VIN easily or owner without specific logic, but for now allow basic updates
    
    await db.vehicles.update_one({"_id": oid}, {"$set": update_data})
    updated_vehicle = await db.vehicles.find_one({"_id": oid})
    return updated_vehicle
