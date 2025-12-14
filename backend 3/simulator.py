import time
import random
import requests
from datetime import datetime

API_URL="http://localhost:8000/telemetry"
VEHICLE_ID = "V102"

state = {
    "speed_kmph": 60,
    "rpm": 1800,
    "engine_temp_c": 85,
    "coolant_temp_c": 80,
    "brake_wear_percent": 40,
    "battery_voltage_v": 12.6,
    "fuel_level_percent": 70,
    "throttle_position_percent": 30,
    "acceleration_mps2": 1.2,
    "gear": 4,
    "odometer_km": 25460,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "engine_status": "ON"
}

def update_state():
    # Speed fluctuation
    state["speed_kmph"] += random.randint(-5, 5)
    state["speed_kmph"] = max(0, min(state["speed_kmph"], 120))

    # RPM follows speed
    state["rpm"] = int(state["speed_kmph"] * 30 + random.randint(-100, 100))

    # Engine temperature rises slowly
    state["engine_temp_c"] += random.uniform(0.2, 0.6)

    # Coolant follows engine temp
    state["coolant_temp_c"] = state["engine_temp_c"] - random.uniform(2, 5)

    # Brake wear increases slowly
    state["brake_wear_percent"] += random.uniform(0.05, 0.15)

    # Battery drains slowly
    state["battery_voltage_v"] -= random.uniform(0.005, 0.015)

    # Fuel drains
    state["fuel_level_percent"] -= random.uniform(0.05, 0.2)

    # Occasional stress event (forces alerts)
    if random.random() < 0.05:
        print("⚠️  Stress event triggered")
        state["engine_temp_c"] += random.uniform(8, 15)
        state["brake_wear_percent"] += random.uniform(3, 6)

    # Clamp values
    state["engine_temp_c"] = min(state["engine_temp_c"], 120)
    state["brake_wear_percent"] = min(state["brake_wear_percent"], 100)
    state["battery_voltage_v"] = max(state["battery_voltage_v"], 10.5)
    state["fuel_level_percent"] = max(state["fuel_level_percent"], 0)


def send_telemetry():
    payload = {
        "vehicle_id": VEHICLE_ID,
        "timestamp": datetime.utcnow().isoformat(),
        **state
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=2)
        if response.status_code == 200:
            print(
                f"📡 Sent | Speed: {state['speed_kmph']} kmph | "
                f"Temp: {round(state['engine_temp_c'], 1)} °C | "
                f"Brake: {round(state['brake_wear_percent'], 1)}%"
            )
        else:
            print("Failed to send telemetry")
    except Exception as e:
        print(f"Error sending telemetry: {e}")


if __name__ == "__main__":
    print("Telemetry Simulator started...")
    while True:
        update_state()
        send_telemetry()
        time.sleep(2)