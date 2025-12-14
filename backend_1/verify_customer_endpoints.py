import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.models.user import UserRole
from app.utils.security import get_password_hash
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def setup_db():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
    # Clear collections for clean test
    await db.users.delete_many({})
    await db.vehicles.delete_many({})
    await db.bookings.delete_many({})
    await db.alerts.delete_many({})
    return db

def register_user(email, password, role):
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": password,
        "role": role
    })
    return response

def login_user(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    return response.json()["access_token"]

def test_customer_flow():
    print("Testing Customer Flow...")
    email = "customer@example.com"
    password = "password123"
    
    # 1. Register
    reg_res = register_user(email, password, "CUSTOMER")
    assert reg_res.status_code == 201, f"Register failed: {reg_res.text}"
    print("Customer registered.")

    # 2. Login
    token = login_user(email, password)
    headers = {"Authorization": f"Bearer {token}"}
    print("Customer logged in.")

    # 3. Register Vehicle
    vehicle_data = {
        "vin": "VIN1234567890",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020
    }
    veh_res = requests.post(f"{BASE_URL}/customer/vehicles", json=vehicle_data, headers=headers)
    assert veh_res.status_code == 201, f"Vehicle register failed: {veh_res.text}"
    vehicle_id = veh_res.json()["_id"]
    print(f"Vehicle registered: {vehicle_id}")

    # 4. Book Service
    booking_data = {
        "vehicle_id": vehicle_id,
        "service_type": "Oil Change",
        "booking_date": datetime.utcnow().isoformat()
    }
    book_res = requests.post(f"{BASE_URL}/customer/bookservice", json=booking_data, headers=headers)
    assert book_res.status_code == 201, f"Booking failed: {book_res.text}"
    print("Service booked.")

    # 5. Get Bookings
    get_book_res = requests.get(f"{BASE_URL}/customer/bookings", headers=headers)
    assert get_book_res.status_code == 200
    assert len(get_book_res.json()) == 1
    print("Bookings retrieved.")

    # 6. Create Alert (Manual DB insert needed as no endpoint for user to create alert usually)
    # We will skip manual insert here and assume if we can read empty list it works, 
    # or we can try to insert via python script if we want to be thorough.
    # Let's just check it returns 200 and empty list for now.
    get_alert_res = requests.get(f"{BASE_URL}/customer/alerts", headers=headers)
    assert get_alert_res.status_code == 200
    print("Alerts retrieved.")

def test_admin_access():
    print("\nTesting Admin Access...")
    email = "admin@example.com"
    password = "adminpassword"
    
    # 1. Register Admin
    reg_res = register_user(email, password, "OEM_ADMIN")
    assert reg_res.status_code == 201, f"Admin register failed: {reg_res.text}"
    print("Admin registered.")

    # 2. Login
    token = login_user(email, password)
    headers = {"Authorization": f"Bearer {token}"}
    print("Admin logged in.")

    # 3. Access Customer Bookings
    get_book_res = requests.get(f"{BASE_URL}/customer/bookings", headers=headers)
    assert get_book_res.status_code == 200
    # Should see the booking created by customer
    assert len(get_book_res.json()) >= 1
    print("Admin accessed customer bookings.")

if __name__ == "__main__":
    # Reset DB first
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(setup_db())
    
    test_customer_flow()
    test_admin_access()
    print("\nAll tests passed!")
