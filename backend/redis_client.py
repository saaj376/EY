import redis
import json

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True
)

def set_telemetry(vehicle_id: str, payload: dict):
    redis_client.set(f"telemetry:{vehicle_id}", json.dumps(payload))

def get_telemetry(vehicle_id: str):
    data = redis_client.get(f"telemetry:{vehicle_id}")
    return json.loads(data) if data else None

def get_all_vehicle_keys():
    return [k.replace("telemetry:", "") for k in redis_client.keys("telemetry:*")]
