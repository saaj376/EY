from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    client.server_info()
    db = client[DB_NAME]
except Exception as e:
    print(f"Warning: Could not connect to MongoDB: {e}")
    print(f"MONGO_URI: {MONGO_URI}")
    print("The server will start but database operations may fail.")
    # Create a dummy client to prevent import errors
    client = None
    db = None

# Collections
users_col = db.users
vehicles_col = db.vehicles
telemetry_col = db.telemetry_events
