from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

from app.schemas.agent_state import AgentState, TelemetryState, MetaState
from app.graphs.master_graph import build_master_graph

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


graph = build_master_graph()



class TelemetryRequest(BaseModel):
    vehicle_id: str
    timestamp: datetime

    speed_kmph: float
    rpm: float

    engine_temp_c: float
    coolant_temp_c: float

    brake_wear_percent: float
    battery_voltage_v: float
    fuel_level_percent: float

    throttle_position_percent: float
    acceleration_mps2: float

    gear: int
    odometer_km: float

    latitude: float
    longitude: float

    engine_status: str



@router.post("/analyze")
def analyze_telemetry(payload: TelemetryRequest):
    telemetry = TelemetryState(**payload.model_dump()) # convert JSON -> TelemetryState

    # Create initial agent state
    state = AgentState(
        vehicle_id=payload.vehicle_id,
        telemetry=telemetry,
        meta=MetaState()
    )

    # Run agentic workflow
    result = graph.invoke(state)

    return result
