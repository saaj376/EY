from fastapi import FastAPI, Body
from utils import get_redis_client, Config
import json
from datetime import datetime

app=FastAPI()
redis_client=get_redis_client()

@app.api_route("/telemetry", methods=["GET", "POST"])
def ingest_telemetry(telemetry: dict = Body(None)):
    if telemetry is not None:
        telemetry['received_at'] = datetime.utcnow().isoformat()
        redis_client.xadd(
            Config.telemetryqueuename,
            {"data": json.dumps(telemetry)}
        )
        return {"status": "queued"}
    return {"status": "ready to receive telemetry data"}
