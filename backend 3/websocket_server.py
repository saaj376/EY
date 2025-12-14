from fastapi import FastAPI,WebSocket,WebSocketDisconnect
app=FastAPI()

active_connections:dict[str,list[WebSocket]]={}

@app.websocket("/ws/customer/{vehicle_id}")
async def customer_ws(websocket: WebSocket, vehicle_id: str):
    await websocket.accept()
    if vehicle_id not in active_connections:
        active_connections[vehicle_id]=[]
    active_connections[vehicle_id].append(websocket)
    print("Client connected for vehicle {vehicle_id}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections[vehicle_id].remove(websocket)
        print("Client disconnected for vehicle {vehicle_id}")

