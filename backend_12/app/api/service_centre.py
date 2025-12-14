from fastapi import APIRouter , HTTPException , Depends
from app.services.service_centre_service import get_active_faults_for_centre
from app.api.vehicles import get_customer_data_access
from app.services.service_centre_service import get_vehicle_history
from app.models.alert import AlertResponse
from app.services.booking_service import update_booking_status , get_db
from pydantic import BaseModel
from typing import Optional
from typing import List
from app.models.user import UserRole
from app.api.vehicles import get_privileged_user


router = APIRouter(
    prefix="/service-centre",
    tags=["Service Centre"]
)

class CompleteJobRequest(BaseModel):
    remarks: Optional[str] = None


@router.get("/{service_centre_id}/faults")
def get_fault_inbox(
    service_centre_id: str,
    user=Depends((get_privileged_user))  # after suki finishes
):
    return get_active_faults_for_centre(service_centre_id)


@router.get("/{vehicle_id}/history")
def vehicle_history(
    vehicle_id: str,
    user=Depends((get_privileged_user))  # after suki finishes
):
    return get_vehicle_history(vehicle_id)

@router.patch("/bookings/{booking_id}/start")
def start_job(
    booking_id: str,
    user=Depends((get_customer_data_access))  # after suki finishes
):
    try:
        update_booking_status(booking_id, "IN_PROGRESS")
        return {
            "booking_id": booking_id,
            "status": "IN_PROGRESS",
            "message": "Job started successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/bookings/{booking_id}/complete")
def complete_job(
    booking_id: str,
    payload: CompleteJobRequest,
    user=Depends(get_privileged_user)
):
    try:
        update_booking_status(
            booking_id,
            "COMPLETED",
            remarks=payload.remarks
        )
        return {
            "booking_id": booking_id,
            "status": "COMPLETED",
            "remarks": payload.remarks,
            "message": "Job completed successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(current_user: dict = Depends(get_customer_data_access)):
    db = await get_db()
    if current_user["role"] == UserRole.CUSTOMER:
        query = {"user_id": current_user["id"]}
    else:
        query = {} # Admin/Service sees all alerts
        
    alerts = await db.alerts.find(query).to_list(length=100)
    return alerts
