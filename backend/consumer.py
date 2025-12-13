import json 
from datetime import datetime
from utils import get_mongo_client, get_redis_client, Config

def start_telemetry_worker():
    mongo=get_mongo_client()
    redis_client=get_redis_client()
    telemetry_collection=mongo["telemetry_events"]
    worker_logs=mongo["worker_logs"]

    last_id="0-0"
    stream_name=Config.telemetryqueuename
    print("Telemetry worker started")

    while True:
        try:
            messages=redis_client.xread(
                {stream_name: last_id},
                block=5000,
                count=10
            )
            if not messages:
                continue
            
            for stream,msgs in messages:
                for msg_id, msg_data in msgs:
                    telemetry=json.loads(msg_data['data'])
                    
                    telemetry_collection.insert_one({
                        "vehicle_id": telemetry.get("vehicle_id"),
                        "timestamp": telemetry.get("timestamp"),
                        "payload": telemetry,
                        "ingested_at": datetime.utcnow()
                    })

                    worker_logs.insert_one({
                        "worker_name":"telemetry_worker",
                        "level":"INFO",
                        "message": f"Telemetry stored for {telemetry.get('vehicle_id')}",
                        "timestamp": datetime.utcnow()
                    })

                    last_id=msg_id
        except Exception as e:
            worker_logs.insert_one({
                "worker_name": "telemetry_worker",
                "level": "ERROR",
                "message": str(e),
                "timestamp": datetime.utcnow()
            })

start_telemetry_worker()