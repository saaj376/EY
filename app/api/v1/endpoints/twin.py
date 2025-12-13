from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.core.database import redis_client
from app.models.user import User
from app.schemas.twin import TwinSnapshot
import json

router = APIRouter()

@router.get("/{vin}", response_model=TwinSnapshot)
def get_twin_snapshot(
    vin: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get latest digital twin snapshot from Redis.
    """
    # In a real app, verify user has access to this VIN
    
    data = redis_client.get(f"twin:{vin}")
    if not data:
        # Return mock data if not found for demo purposes, or 404
        # For this task, let's return a 404 or a default mock
        # raise HTTPException(status_code=404, detail="Twin data not found")
        
        # Returning mock data for demonstration if Redis is empty
        return TwinSnapshot(
            vin=vin,
            speed=0.0,
            rpm=0.0,
            engine_temp=90.0,
            battery_level=100.0,
            brake_wear=0.0,
            driver_score=100.0,
            severity="LOW",
            predicted_issues=[]
        )
    
    return TwinSnapshot(**json.loads(data))
