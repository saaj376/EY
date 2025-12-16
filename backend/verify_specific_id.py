from db import db
from bson import ObjectId

target_id = "69413b45ef229cf06597b4ae"
print(f"Target ID: {target_id}")

# Check Service Centres
try:
    sc = db.service_centres.find_one({"_id": ObjectId(target_id)})
    if sc:
        print(f"Service Centre FOUND: {sc['name']}")
    else:
        print(f"Service Centre NOT FOUND by ObjectId")
        # Try string
        sc_str = db.service_centres.find_one({"_id": target_id})
        if sc_str:
             print(f"Service Centre FOUND by String: {sc_str['name']}")
        else:
             print("Service Centre NOT FOUND by String either.")
except Exception as e:
    print(f"Error checking SC: {e}")

# Check Bookings
print("\nChecking Bookings...")
bookings = list(db.bookings.find({"service_centre_id": target_id}))
print(f"Found {len(bookings)} bookings matching 'service_centre_id': '{target_id}'")

if len(bookings) == 0:
    print("Checking if bookings use ObjectId...")
    try:
        bookings_obj = list(db.bookings.find({"service_centre_id": ObjectId(target_id)}))
        print(f"Found {len(bookings_obj)} bookings matching ObjectId('{target_id}')")
    except:
        pass

print("\n--- First 3 Bookings in DB ---")
all_bookings = list(db.bookings.find().limit(3))
for b in all_bookings:
    print(f"ID: {b.get('_id')}, SC: {b.get('service_centre_id')} (Type: {type(b.get('service_centre_id'))})")
