from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket_manager import ConnectionManager
from redis_client import get_telemetry
from db import db
from datetime import datetime
import asyncio

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/telemetry/{vehicle_id}")
async def telemetry_socket(websocket: WebSocket, vehicle_id: str):
    # NOTE: for demo, user_id comes from query param or header
    user_id = websocket.query_params.get("user_id") or websocket.headers.get("X-User-Id", "demo-user")

    await manager.connect(vehicle_id, websocket)

    session = {
        "user_id": user_id,
        "vehicle_id": vehicle_id,
        "connected_at": datetime.utcnow(),
        "disconnected_at": None
    }

    result = db.ws_sessions.insert_one(session)
    session_id = result.inserted_id

    try:
        while True:
            telemetry = get_telemetry(vehicle_id)
            if telemetry:
                await manager.broadcast(vehicle_id, telemetry)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        manager.disconnect(vehicle_id, websocket)

        db.ws_sessions.update_one(
            {"_id": session_id},
            {"$set": {"disconnected_at": datetime.utcnow()}}
        )
