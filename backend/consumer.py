import json 
from datetime import datetime
from utils import get_mongo_client, get_redis_client, Config
import asyncio
from websocket_server import active_connections

async def push_to_websocket(vehicle_id: str,telemetry:dict):
    connections=active_connections.get(vehicle_id,[])
    for ws in list(connections):
        try:
            await ws.send_json({
                "type":"TELEMETRY UPDATE",
                "vehicle_id":vehicle_id,
                "data": telemetry,
                "timestamp": telemetry.get("timestamp")
            })
        except Exception:
            connections.remove(ws)

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
                    vehicle_id=telemetry.get("vehicle_id")
                    
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

                    asyncio.run(push_to_websocket(vehicle_id,telemetry))

                    last_id=msg_id
                    
        except Exception as e:
            worker_logs.insert_one({
                "worker_name": "telemetry_worker",
                "level": "ERROR",
                "message": str(e),
                "timestamp": datetime.utcnow()
            })

start_telemetry_worker()