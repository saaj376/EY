from fastapi import APIRouter, HTTPException, Depends
from app.models.twin import TwinStateResponse
from app.utils.security import get_current_user_token
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/twin", tags=["Digital Twin"])

@router.get("/{vehicle_id}", response_model=TwinStateResponse)
async def get_twin_state(vehicle_id: str, current_user: dict = Depends(get_current_user_token)):
    # Any authenticated user can view a twin? 
    # Requirement says "summary view, read-only". 
    # Ideally, Customer sees own, Service/OEM sees all.
    # For now, we'll allow access but we should probably check ownership if Customer.
    
    db = await get_database()
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
