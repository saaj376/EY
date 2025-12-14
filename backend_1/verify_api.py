import requests
import time

BASE_URL = "http://localhost:8001"

def test_api():
    print("Waiting for server to start...")
    time.sleep(5)
    
    # 1. Root
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"Root: {r.status_code} {r.json()}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Server not up: {e}")
        return

    # 2. Register Customer
    customer_email = "cust@example.com"
    customer_pass = "password123"
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "John Doe",
        "email": customer_email,
        "password": customer_pass,
        "role": "CUSTOMER"
    })
    print(f"Register Customer: {r.status_code}")
    if r.status_code == 400 and "already registered" in r.text:
        print("Customer already registered")
    else:
        assert r.status_code == 201

    # 3. Login Customer
    r = requests.post(f"{BASE_URL}/auth/login", data={
        "username": customer_email,
        "password": customer_pass
    })
    print(f"Login Customer: {r.status_code}")
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Register Vehicle (Customer)
    vin = "VIN1234567890"
    r = requests.post(f"{BASE_URL}/customer/vehicles", headers=headers, json={
        "vin": vin,
        "make": "Toyota",
        "model": "Camry",
        "year": 2022
    })
    print(f"Register Vehicle: {r.status_code}")
    if r.status_code == 400 and "already exists" in r.text:
        print("Vehicle already exists")
    else:
        assert r.status_code == 201

    # 5. Get Vehicles
    r = requests.get(f"{BASE_URL}/customer/vehicles", headers=headers)
    print(f"Get Vehicles: {r.status_code} {r.json()}")
    assert r.status_code == 200
    assert len(r.json()) > 0

    print("Verification Passed!")

if __name__ == "__main__":
    test_api()
