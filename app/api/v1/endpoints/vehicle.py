from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleResponse

router = APIRouter()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_in: VehicleCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new vehicle.
    """
    if current_user.role != UserRole.CUSTOMER:
         # In a real scenario, maybe admins can create vehicles for users too.
         # For now, let's assume customers register their own vehicles.
         pass

    vehicle = db.query(Vehicle).filter(Vehicle.vin == vehicle_in.vin).first()
    if vehicle:
        raise HTTPException(status_code=400, detail="Vehicle with this VIN already exists")
    
    vehicle = Vehicle(
        vin=vehicle_in.vin,
        make=vehicle_in.make,
        model=vehicle_in.model,
        year=vehicle_in.year,
        owner_id=current_user.id,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/", response_model=List[VehicleResponse])
def read_vehicles(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve vehicles.
    """
    if current_user.role in [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST, UserRole.SERVICE_CENTER]:
        vehicles = db.query(Vehicle).offset(skip).limit(limit).all()
    else:
        vehicles = db.query(Vehicle).filter(Vehicle.owner_id == current_user.id).offset(skip).limit(limit).all()
    return vehicles

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def read_vehicle(
    vehicle_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get vehicle by ID.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if current_user.role == UserRole.CUSTOMER and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return vehicle
