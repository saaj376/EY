from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    SERVICE_CENTER = "SERVICE_CENTER"
    OEM_ADMIN = "OEM_ADMIN"
    OEM_ANALYST = "OEM_ANALYST"

def validate_telemetry(data: dict):
    required = [
        "vehicle_id", "timestamp",
        "speed_kmph", "rpm",
        "engine_temp_c", "coolant_temp_c",
        "brake_wear_percent", "battery_voltage_v",
        "fuel_level_percent",
        "latitude", "longitude",
        "engine_status"
    ]
    for field in required:
        if field not in data:
            raise ValueError(f"Missing field: {field}")
