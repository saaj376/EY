from fastapi import APIRouter, Depends, HTTPException
from app.api.vehicles import get_customer_data_access
from app.models.booking import BookingCreate, BookingResponse
from app.services.booking_service import create_customer_booking , get_db
from app.services.booking_service import update_booking_status , create_customer_booking
from typing import List
from app.models.user import UserRole




router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.patch("/{booking_id}/confirm")
def confirm_booking(
    booking_id: str,
    user=Depends(get_customer_data_access),
):
    try:
        update_booking_status(booking_id, "CONFIRMED")
        return {"status": "CONFIRMED"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------------------new shi---------------------
@router.post("/bookservice", response_model=BookingResponse) # manual booking by customers
async def book_service(
    booking: BookingCreate,
    current_user: dict = Depends(get_customer_data_access)
):
    booking_result = await create_customer_booking(
        vehicle_id=booking.vehicle_id,
        user_id=current_user["id"]
    )
    return booking_result

@router.get("/details", response_model=List[BookingResponse])
async def get_bookings(current_user: dict = Depends(get_customer_data_access)):
    db = await get_db()
    if current_user["role"] == UserRole.CUSTOMER:
        query = {"user_id": current_user["id"]}
    else:
        query = {} # Admin/Service sees all bookings
        
    bookings = await db.bookings.find(query).to_list(length=100)
    return bookings



