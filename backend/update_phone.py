
from db import db

def update_phone():
    user_id = "u1"  # "Saajan" based on previous investigation
    phone = "+9444082981"
    
    print(f"Updating user {user_id} with phone {phone}...")
    result = db.users.update_one(
        {"_id": user_id},
        {"$set": {"phone": phone}}
    )
    
    if result.modified_count > 0:
        print("Update SUCCESSFUL.")
    else:
        print("Update FAILED or NO CHANGE.")
        
    # Verify
    user = db.users.find_one({"_id": user_id})
    print(f"User {user_id} phone is now: {user.get('phone')}")

if __name__ == "__main__":
    update_phone()
