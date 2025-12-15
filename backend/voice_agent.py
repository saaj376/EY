# voice_agent.py
import asyncio
import base64
import json
import os
from fastapi import WebSocket, APIRouter
import websockets
from dotenv import load_dotenv
from twilio.rest import Client
from db import db
load_dotenv()

# Call context keyed by Twilio streamSid
CALL_CONTEXT = {}

router = APIRouter()

# ================================
# Agent config
# ================================

def load_agent_config():
    with open("config.json", "r") as f:
        return json.load(f)

# ================================
# Agent event handling
# ================================



def _tool_get_user_alerts(user_id: str, limit: int = 5):
    """
    Fetch recent alerts for all vehicles owned by a given user.
    """
    print(f"[TOOL:get_user_alerts] user_id={user_id}, limit={limit}")
    vehicle_ids = db.vehicles.distinct("_id", {"owner_user_id": user_id})
    alerts = list(
        db.alerts.find({"vehicle_id": {"$in": vehicle_ids}}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(int(limit))
    )
    return {"alerts": alerts}

def _tool_get_user_diagnosis(user_id: str, limit: int = 5):
    """
    Fetch recent diagnosis entries related to a user's vehicles.
    """
    print(f"[TOOL:get_user_diagnosis] user_id={user_id}, limit={limit}")
    vehicle_ids = db.vehicles.distinct("_id", {"owner_user_id": user_id})
    alert_ids = db.alerts.distinct("_id", {"vehicle_id": {"$in": vehicle_ids}})
    diagnosis = list(
        db.diagnosis.find({"alert_id": {"$in": alert_ids}}, {"_id": 0})
        .sort("created_at", -1)
        .limit(int(limit))
    )
    return {"diagnosis": diagnosis}

FUNCTION_MAP = {
    "get_user_alerts": _tool_get_user_alerts,
    "get_user_diagnosis": _tool_get_user_diagnosis,
}

def execute_function_call(func_name, arguments, stream_sid=None):
    # If user_id not provided, try to infer from call context (phone → user)
    if not arguments.get("user_id") and stream_sid:
        ctx = CALL_CONTEXT.get(stream_sid) or {}
        inferred_user_id = ctx.get("user_id")
        if inferred_user_id:
            print(f"[AGENT FUNC] inferring user_id from context for streamSid={stream_sid}")
            arguments["user_id"] = inferred_user_id

    # Final fallback: use DEFAULT_USER_ID env var if still missing
    if not arguments.get("user_id"):
        default_user_id = os.getenv("DEFAULT_USER_ID")
        if default_user_id:
            print(f"[AGENT FUNC] falling back to DEFAULT_USER_ID={default_user_id}")
            arguments["user_id"] = default_user_id

    if func_name in FUNCTION_MAP:
        try:
            result = FUNCTION_MAP[func_name](**arguments)
        except TypeError:
            # Fallback if Deepgram sends extra args
            filtered_args = {k: v for k, v in arguments.items() if k in ("user_id", "limit")}
            result = FUNCTION_MAP[func_name](**filtered_args)
        print(f"Function call result: {result}")
        return result
    else:
        result = {"error": f"Unknown function: {func_name}"}
        print(result)
        return result

def create_function_call_response(func_id, func_name, result):
    return {
        "type": "FunctionCallResponse",
        "id": func_id,
        "name": func_name,
        # Use default=str so datetime and ObjectId become serializable strings
        "content": json.dumps(result, default=str),
    }

async def handle_function_call_request(decoded, agent_ws, stream_sid):
    try:
        for function_call in decoded.get("functions", []):
            func_name = function_call["name"]
            func_id = function_call["id"]
            arguments = json.loads(function_call.get("arguments") or "{}")

            print(f"Function call: {func_name} (ID: {func_id}), arguments: {arguments}")

            result = execute_function_call(func_name, arguments, stream_sid)

            function_result = create_function_call_response(func_id, func_name, result)
            await agent_ws.send(json.dumps(function_result))
            print(f"Sent function result: {function_result}")

    except Exception as e:
        print(f"Error calling function: {e}")
        error_result = create_function_call_response(
            func_id if "func_id" in locals() else "unknown",
            func_name if "func_name" in locals() else "unknown",
            {"error": f"Function call failed with: {str(e)}"},
        )
        await agent_ws.send(json.dumps(error_result))

async def handle_agent_event(event, twilio_ws, agent_ws, stream_sid):
    event_type = event.get("type")
    print(f"[AGENT EVENT] type={event_type}")

    # Barge-in handling
    if event_type == "UserStartedSpeaking":
        await twilio_ws.send_json({"event": "clear", "streamSid": stream_sid})

    # Function calls from Deepgram agent
    if event_type == "FunctionCallRequest":
        await handle_function_call_request(event, agent_ws, stream_sid)
# ================================
# Streaming loops
# ================================

async def agent_sender(agent_ws, audio_queue):
    while True:
        chunk = await audio_queue.get()
        await agent_ws.send(chunk)

async def agent_receiver(agent_ws, twilio_ws, stream_sid_queue):
    stream_sid = await stream_sid_queue.get()

    async for msg in agent_ws:
        if isinstance(msg, str):
            event = json.loads(msg)
            await handle_agent_event(event, twilio_ws, agent_ws, stream_sid)
            continue

        await twilio_ws.send_json({
            "event": "media",
            "streamSid": stream_sid,
            "media": {
                "payload": base64.b64encode(msg).decode("ascii")
            }
        })

async def twilio_receiver(twilio_ws, audio_queue, stream_sid_queue):
    BUFFER = 20 * 160
    buffer = bytearray()

    async for msg in twilio_ws.iter_text():
        data = json.loads(msg)
        event = data.get("event")

        if event == "start":
            start_info = data["start"]
            sid = start_info["streamSid"]
            stream_sid_queue.put_nowait(sid)

            # Capture caller phone and map to user_id for this stream
            caller = start_info.get("from")
            CALL_CONTEXT[sid] = {"from": caller}

            if caller:
                user = db.users.find_one({"phone": caller})
                if user:
                    CALL_CONTEXT[sid]["user_id"] = str(user["_id"])
                    print(f"[TWILIO] Stream started, streamSid={sid}, caller={caller}, mapped_user_id={CALL_CONTEXT[sid]['user_id']}")
                else:
                    print(f"[TWILIO] Stream started, streamSid={sid}, caller={caller}, no user found")
            else:
                print(f"[TWILIO] Stream started, streamSid={sid}, no caller in start payload")

        elif event == "media" and data["media"]["track"] == "inbound":
            buffer.extend(base64.b64decode(data["media"]["payload"]))

        elif event == "mark":
            mark_name = data.get("mark", {}).get("name")
            print(f"[TWILIO] Mark received: {mark_name}")

        elif event == "stop":
            print("[TWILIO] Stream stopped by Twilio")
            break

        while len(buffer) >= BUFFER:
            audio_queue.put_nowait(buffer[:BUFFER])
            buffer = buffer[BUFFER:]



def trigger_voice_call(phone_number: str):
    """
    Triggers an outbound voice call for HIGH severity alerts.
    """
    print(f"[CALL] Initiating outbound call to {phone_number}")

    try:
        client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN"),
        )

        twiml = f"""
<Response>
    <Say voice="alice">
        High severity vehicle alert detected.
        Please take immediate action.
    </Say>
    <Connect>
        <Stream url="wss://celestial-characterless-jacoby.ngrok-free.dev/twilio"/>
    </Connect>
</Response>
"""
        print(f"[CALL] Using TwiML: {twiml}")

        call = client.calls.create(
            to=phone_number,
            from_=os.getenv("TWILIO_FROM_NUMBER"),
            twiml=twiml,
        )

        print(f"[CALL] Twilio call SID={call.sid}")
        return call.sid

    except Exception as e:
        print(f"[CALL] Failed to initiate call: {e}")
        return None
# ================================
# WebSocket route
# ================================

@router.websocket("/twilio")
async def twilio_ws_endpoint(ws: WebSocket):
    await ws.accept()
    print("[WS] Twilio connected")

    audio_queue = asyncio.Queue()
    stream_sid_queue = asyncio.Queue()

    api_key = os.getenv("DEEPGRAM_API_KEY")

    try:
        async with websockets.connect(
            "wss://agent.deepgram.com/v1/agent/converse",
            additional_headers={"Authorization": f"Token {api_key}"},
        ) as agent_ws:

            print("[WS] Connected to Deepgram agent")
            await agent_ws.send(json.dumps(load_agent_config()))
            print("[WS] Sent agent config to Deepgram")

            tasks = [
                asyncio.create_task(agent_sender(agent_ws, audio_queue)),
                asyncio.create_task(agent_receiver(agent_ws, ws, stream_sid_queue)),
                asyncio.create_task(twilio_receiver(ws, audio_queue, stream_sid_queue)),
            ]

            done, pending = await asyncio.wait(
                tasks,
                return_when=asyncio.FIRST_COMPLETED,
            )

            print(f"[WS] Tasks completed: done={len(done)}, pending={len(pending)}")
            for task in pending:
                task.cancel()

    except Exception as e:
        print(f"[WS] Error in Twilio WS endpoint: {e}")
