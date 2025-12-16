from db import db
from pprint import pprint

print("--- ALL SERVICE CENTRES ---")
centres = list(db.service_centres.find())
for c in centres:
    print(f"ID: {c['_id']}, Name: {c.get('name')}")

print("\n--- ALL BOOKINGS ---")
bookings = list(db.bookings.find())
for b in bookings:
    print(f"ID: {b.get('_id')}, SC_ID: {b.get('service_centre_id')}, User: {b.get('user_id')}, Status: {b.get('status')}")

Expected_SC_ID = "69413b45ef229cf06597b4ae"
print(f"\nChecking for SC_ID: {Expected_SC_ID}")
matched = [b for b in bookings if str(b.get('service_centre_id')) == Expected_SC_ID]
print(f"Found {len(matched)} bookings for this Service Centre.")
