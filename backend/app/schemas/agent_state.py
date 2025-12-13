from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4

class TelemetryState(BaseModel):
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


class AnomalyState(BaseModel):
    detected: bool
    type: Optional[str] = None
    severity: Optional[str] = None


class DiagnosisState(BaseModel):
    probable_cause: Optional[str] = None
    recommended_action: Optional[str] = None
    urgency: Optional[str] = None


class BookingState(BaseModel):
    service_center_id: Optional[str] = None
    slot_id: Optional[str] = None
    status: Optional[str] = None


class MetaState(BaseModel):
    trace_id: str = uuid4().hex
    timestamp: datetime = datetime.utcnow()


class AgentState(BaseModel):
    vehicle_id: str
    telemetry: TelemetryState
    anomaly: Optional[AnomalyState] = None
    diagnosis: Optional[DiagnosisState] = None
    booking: Optional[BookingState] = None
    meta: MetaState = MetaState()   