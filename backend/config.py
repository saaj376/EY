import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "vehicle_intelligence")

# Telemetry thresholds (used later)
ENGINE_TEMP_LIMIT = 95
BRAKE_WEAR_LIMIT = 70
