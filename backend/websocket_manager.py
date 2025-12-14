from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.active_connections = defaultdict(list)

    async def connect(self, vehicle_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[vehicle_id].append(websocket)

    def disconnect(self, vehicle_id: str, websocket: WebSocket):
        self.active_connections[vehicle_id].remove(websocket)

    async def broadcast(self, vehicle_id: str, data: dict):
        for ws in self.active_connections.get(vehicle_id, []):
            await ws.send_json(data)
