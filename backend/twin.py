# twin.py
from db import db
from datetime import datetime

twin_col = db.twin_state

def update_twin_state(vehicle_id, telemetry):
    twin_col.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                "speed": telemetry["speed_kmph"],
                "rpm": telemetry["rpm"],
                "engine_temp": telemetry["engine_temp_c"],
                "battery_level": telemetry["battery_voltage_v"],
                "brake_wear": telemetry["brake_wear_percent"],
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
