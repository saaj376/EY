from db import db
sc = db.service_centres.find_one({"name": "EY Premier Service Centre"})
if sc:
    print(f"FOUND_ID: {sc['_id']}")
else:
    print("NOT FOUND")
