from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import List, Optional
from app.models.user import UserResponse, UserRole
from app.models.vehicle import VehicleCreate, VehicleResponse, VehicleInDB
from app.models.booking import BookingCreate, BookingResponse, BookingInDB, BookingStatus
from app.models.alert import AlertCreate, AlertResponse, AlertInDB, AlertStatus
from app.utils.security import get_current_user_token
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/customer", tags=["Customer"])

async def get_customer_data_access(current_user: dict = Depends(get_current_user_token)):
    allowed_roles = [UserRole.CUSTOMER, UserRole.OEM_ADMIN, UserRole.SERVICE_CENTER]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to access customer data")
    return current_user

@router.get("/vehicles", response_model=List[VehicleResponse])
async def get_my_vehicles(current_user: dict = Depends(get_customer_data_access)):
    db = await get_database()
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

@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def register_my_vehicle(vehicle: VehicleCreate, current_user: dict = Depends(get_customer_data_access)):
    # Only customers should register "my" vehicle usually, but allowing admin to register for a user could be valid.
    # For now, we'll assume the "owner" is the current user if they are a customer.
    # If admin registers, who is the owner? 
    # Let's stick to: Only CUSTOMER can register their own vehicle via this endpoint for simplicity, 
    # or Admin registers it and assigns it (but VehicleCreate doesn't have owner_id).
    # We will enforce that only CUSTOMER can use this specific "register_my_vehicle" endpoint to avoid ambiguity,
    # or we assign the current user as owner.
    
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

@router.get("/bookings", response_model=List[BookingResponse])
async def get_bookings(current_user: dict = Depends(get_customer_data_access)):
    db = await get_database()
    if current_user["role"] == UserRole.CUSTOMER:
        query = {"user_id": current_user["id"]}
    else:
        query = {} # Admin/Service sees all bookings
        
    bookings = await db.bookings.find(query).to_list(length=100)
    return bookings

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(current_user: dict = Depends(get_customer_data_access)):
    db = await get_database()
    if current_user["role"] == UserRole.CUSTOMER:
        query = {"user_id": current_user["id"]}
    else:
        query = {} # Admin/Service sees all alerts
        
    alerts = await db.alerts.find(query).to_list(length=100)
    return alerts

@router.post("/bookservice", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def book_service(booking: BookingCreate, current_user: dict = Depends(get_customer_data_access)):
    db = await get_database()
    
    # Verify vehicle belongs to user if it's a customer
    if current_user["role"] == UserRole.CUSTOMER:
        vehicle = await db.vehicles.find_one({"_id": ObjectId(booking.vehicle_id), "owner_user_id": current_user["id"]})
        if not vehicle:
             raise HTTPException(status_code=404, detail="Vehicle not found or does not belong to you")
    
    booking_in_db = BookingInDB(
        **booking.dict(),
        user_id=current_user["id"]
    )
    new_booking = await db.bookings.insert_one(booking_in_db.dict(by_alias=True, exclude={"id"}))
    created_booking = await db.bookings.find_one({"_id": new_booking.inserted_id})
    return created_booking

@router.post("/respond")
async def respond_to_alert(alert_id: str = Body(...), response: str = Body(...), current_user: dict = Depends(get_customer_data_access)):
    db = await get_database()
    alert = await db.alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if current_user["role"] == UserRole.CUSTOMER and alert["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this alert")
        
    await db.alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"response": response, "status": AlertStatus.RESOLVED, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Response recorded"}
