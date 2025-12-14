from fastapi import APIRouter , HTTPException
from app.services.service_centre_service import get_active_faults_for_centre
from app.services.service_centre_service import get_vehicle_history
from app.services.booking_service import update_booking_status
from pydantic import BaseModel
from typing import Optional
# from app.auth.dependencies import require_only
# from app.auth.roles import Role

router = APIRouter(
    prefix="/service-centre",
    tags=["Service Centre"]
)

class CompleteJobRequest(BaseModel):
    remarks: Optional[str] = None


@router.get("/{service_centre_id}/faults")
def get_fault_inbox(
    service_centre_id: str,
    # user=Depends(require_only(Role.SERVICE_CENTRE))  # after suki finishes
):
    return get_active_faults_for_centre(service_centre_id)


@router.get("/{vehicle_id}/history")
def vehicle_history(
    vehicle_id: str,
    # user=Depends(require_only(Role.SERVICE_CENTRE))  # after suki finishes
):
    return get_vehicle_history(vehicle_id)

@router.patch("/bookings/{booking_id}/start")
def start_job(
    booking_id: str,
    # user=Depends(require_only(Role.SERVICE_CENTRE))  # after suki finishes
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
    # user=Depends(require_only(Role.SERVICE_CENTRE))
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