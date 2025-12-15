
from db import db
from datetime import datetime
from utils import UserRole

def create_service_center_user():
    # 1. Create Service Centre
    service_centre = {
        "name": "EY Premier Service Centre",
        "location": "Colombo 03",
        "contact": "+94112233445",
        "max_capacity": 10,
        "working_hours": {
            "start": "08:00",
            "end": "18:00"
        },
        "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "created_at": datetime.utcnow()
    }
    
    sc_result = db.service_centres.insert_one(service_centre)
    sc_id = str(sc_result.inserted_id)
    print(f"Created Service Centre: {service_centre['name']} (ID: {sc_id})")

    # 2. Create User linked to this Service Centre
    user_email = "service@ey.com"
    user_name = "Service Manager"
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": user_email})
    if existing_user:
        print(f"User {user_email} already exists. Updating role and linking to new center.")
        db.users.update_one(
            {"email": user_email},
            {
                "$set": {
                    "role": UserRole.SERVICE_CENTER.value,
                    "service_centre_id": sc_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        user_id = str(existing_user["_id"])
    else:
        user = {
            "name": user_name,
            "email": user_email,
            "password_hash": "hashed_password_123", # Dummy hash
            "role": UserRole.SERVICE_CENTER.value,
            "phone": "+94770000001",
            "service_centre_id": sc_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = db.users.insert_one(user)
        user_id = str(res.inserted_id)
        print(f"Created New User: {user_name} (ID: {user_id})")

    with open("credentials.txt", "w") as f:
        f.write("--- CREDENTIALS ---\n")
        f.write(f"Email: {user_email}\n")
        f.write(f"Role: {UserRole.SERVICE_CENTER.value}\n")
        f.write(f"Service Centre ID: {sc_id}\n")
        f.write(f"User ID: {user_id}\n")
        f.write("-------------------\n")

    print("\n--- CREDENTIALS written to credentials.txt ---")

if __name__ == "__main__":
    create_service_center_user()
