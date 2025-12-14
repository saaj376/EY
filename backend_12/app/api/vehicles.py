from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models.user import UserRole
from app.models.twin import TwinStateResponse
from app.models.vehicle import VehicleCreate, VehicleResponse, VehicleInDB 
from app.utils.security import get_current_user_token
from app.utils.connection import get_db
from bson import ObjectId

router = APIRouter(prefix="/vehicles", tags=["Vehicle Management"])

async def get_privileged_user(current_user: dict = Depends(get_current_user_token)):
    if current_user["role"] not in [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

async def get_customer_data_access(current_user: dict = Depends(get_current_user_token)):
    allowed_roles = [UserRole.CUSTOMER, UserRole.OEM_ADMIN, UserRole.SERVICE_CENTER]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to access customer data")
    return current_user


@router.get("/twin-state/{vehicle_id}", response_model=TwinStateResponse) # digital twin state of a vehicle
async def get_twin_state(vehicle_id: str, current_user: dict = Depends(get_current_user_token)):
    # Any authenticated user can view a twin? 
    # Requirement says "summary view, read-only". 
    # Ideally, Customer sees own, Service/OEM sees all.
    # For now, we'll allow access but we should probably check ownership if Customer.
    
    db = await get_db()
    try:
        oid = ObjectId(vehicle_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid vehicle ID")
        
    # If customer, check ownership
    if current_user["role"] == "CUSTOMER":
        vehicle = await db.vehicles.find_one({"_id": oid})
        if not vehicle or str(vehicle["owner_user_id"]) != current_user["id"]:
             raise HTTPException(status_code=403, detail="Not authorized to view this vehicle")

    twin = await db.twin_state.find_one({"vehicle_id": str(oid)})
    if not twin:
        # Return empty/default state if not found, or 404. 
        # Requirement implies persistent snapshot.
        raise HTTPException(status_code=404, detail="Twin state not found")
        
    return twin

@router.post("/admin-register", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def register_vehicle(vehicle: VehicleCreate, owner_email: str, current_user: dict = Depends(get_privileged_user)):
    db = await get_db()
    
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
    db = await get_db()
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
    db = await get_db()
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

@router.get("/my", response_model=List[VehicleResponse])
async def get_my_vehicles(current_user: dict = Depends(get_customer_data_access)):
    db = await get_db()
    # If customer, return own vehicles. If admin/service, return all (or filter by query param if implemented later)
    # For now, assuming admin/service might want to see specific customer's vehicles, but without a user_id param, 
    # we'll default to returning all for them or just their own if they were customers (which they aren't).
    # Let's refine: If CUSTOMER, return own. If others, return ALL (for now, as per "handle any get/customer/* things")
    
    if current_user["role"] == UserRole.CUSTOMER:
        query = {"owner_user_id": current_user["id"]}
    else:
        query = {} # Admin/Service sees all vehicles
        
    vehicles = await db.vehicles.find(query).to_list(length=100)
    return vehicles


@router.post("/customer-register", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def register_my_vehicle(vehicle: VehicleCreate, current_user: dict = Depends(get_customer_data_access)):
    # Only customers should register "my" vehicle usually, but allowing admin to register for a user could be valid.
    # For now, we'll assume the "owner" is the current user if they are a customer.
    # If admin registers, who is the owner? 
    # Let's stick to: Only CUSTOMER can register their own vehicle via this endpoint for simplicity, 
    # or Admin registers it and assigns it (but VehicleCreate doesn't have owner_id).
    # We will enforce that only CUSTOMER can use this specific "register_my_vehicle" endpoint to avoid ambiguity,
    # or we assign the current user as owner.
    
    db = await get_db()
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