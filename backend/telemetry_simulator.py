import time
import random
from datetime import datetime
from redis_client import set_telemetry
from db import telemetry_col, vehicles_col  # <-- your vehicles collection
from alerts import create_alert

# keep last known state per vehicle (keyed by VIN so it matches telemetry API)
STATE = {}


def _check_and_create_alerts(vehicle_db_id, prev_state: dict, current: dict):
    """
    Simple rule-based alerting on simulated telemetry.
    - High engine temperature
    - High brake wear
    - Very low fuel

    We only fire when crossing the threshold to avoid spamming alerts.
    """
    # Engine overheat
    prev_temp = prev_state.get("engine_temp_c", current["engine_temp_c"])
    curr_temp = current["engine_temp_c"]
    if prev_temp <= 95 and curr_temp > 95:
        create_alert(
            vehicle_id=vehicle_db_id,
            alert_type="ENGINE_OVERHEAT",
            value=curr_temp,
            severity="HIGH",
        )

    # Brake wear nearing limit
    prev_brake = prev_state.get("brake_wear_percent", current["brake_wear_percent"])
    curr_brake = current["brake_wear_percent"]
    if prev_brake < 80 <= curr_brake:
        create_alert(
            vehicle_id=vehicle_db_id,
            alert_type="BRAKE_WEAR_HIGH",
            value=curr_brake,
            severity="MEDIUM",
        )

    # Critically low fuel
    prev_fuel = prev_state.get("fuel_level_percent", current["fuel_level_percent"])
    curr_fuel = current["fuel_level_percent"]
    if prev_fuel >= 10 > curr_fuel:
        create_alert(
            vehicle_id=vehicle_db_id,
            alert_type="FUEL_LOW",
            value=curr_fuel,
            severity="LOW",
        )


def generate(vehicle_vin: str, vehicle_db_id):
    prev_state = STATE.get(
        vehicle_vin,
        {
            "speed_kmph": 40,
            "rpm": 2200,
            "engine_temp_c": 94.0,
            "coolant_temp_c": 80.0,
            "fuel_level_percent": 70.0,
            "battery_voltage_v": 12.6,
            "brake_wear_percent": 10.0,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "engine_status": "ON",
        },
    )

    data = {
        # Keep VIN as vehicle_id for telemetry APIs / frontend
        "vehicle_id": vehicle_vin,
        "speed_kmph": max(0, prev_state["speed_kmph"] + random.randint(-2, 3)),
        "rpm": max(800, prev_state["rpm"] + random.randint(-100, 150)),
        "engine_temp_c": round(
            prev_state["engine_temp_c"] + random.choice([0, 0.2, 0.3]), 1
        ),
        "coolant_temp_c": round(
            prev_state["coolant_temp_c"] + random.choice([0, 0.1]), 1
        ),
        "fuel_level_percent": round(
            max(0, prev_state["fuel_level_percent"] - 0.02), 2
        ),
        "battery_voltage_v": round(12.4 + random.random() * 0.3, 2),
        "brake_wear_percent": prev_state["brake_wear_percent"],
        "latitude": prev_state["latitude"] + random.uniform(-0.0001, 0.0001),
        "longitude": prev_state["longitude"] + random.uniform(-0.0001, 0.0001),
        "engine_status": "ON",
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Update in‑memory state first so we can compare for threshold crossing
    STATE[vehicle_vin] = data

    # Run rule-based alerting using DB vehicle id so alerts link back to the owner
    _check_and_create_alerts(vehicle_db_id=vehicle_db_id, prev_state=prev_state, current=data)

    # Persist telemetry for live view / history
    set_telemetry(vehicle_vin, data)
    telemetry_col.insert_one(data)


def telemetry_simulator_loop():
    while True:
        vehicles = vehicles_col.find({}, {"vin": 1})
        for v in vehicles:
            # v still includes "_id" even when projecting "vin"
            generate(vehicle_vin=v["vin"], vehicle_db_id=v["_id"])
        time.sleep(3)
