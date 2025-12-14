from fastapi import APIRouter, Depends, HTTPException

from app.services.booking_service import update_booking_status
# from app.auth.dependencies import require_role  
# from app.auth.roles import Role  

# uncomment RBAC related shi when suki finishes

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.patch("/{booking_id}/confirm")
def confirm_booking(
    booking_id: str,
    # user=Depends(require_role(Role.CUSTOMER)),
):
    try:
        update_booking_status(booking_id, "CONFIRMED")
        return {"status": "CONFIRMED"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{booking_id}/start")
def start_service(
    booking_id: str,
    # user=Depends(require_role(Role.SERVICE_CENTRE)),
):
    try:
        update_booking_status(booking_id, "IN_PROGRESS")
        return {"status": "IN_PROGRESS"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{booking_id}/complete")
def complete_service(
    booking_id: str,
    # user=Depends(require_role(Role.SERVICE_CENTRE)),
):
    try:
        update_booking_status(booking_id, "COMPLETED")
        return {"status": "COMPLETED"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
