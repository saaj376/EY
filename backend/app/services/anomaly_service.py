from app.schemas.agent_state import TelemetryState, AnomalyState
from uuid import uuid4
from datetime import datetime
from app.connection import client 
from app.connection import get_db


def alerts_to_db(vehicle_id: str,telemetry: TelemetryState,anomaly: AnomalyState,) -> str:
    """
    Persists an alert and returns alert_id
    """

    db = get_db()
    alerts_collection = db["alerts"]
    alert_id = uuid4().hex

    alert_doc = {
        "id": alert_id,
        "vehicle_id": vehicle_id,
        "timestamp": telemetry.timestamp,
        "alert_type": anomaly.type,
        "value": _get_trigger_value(telemetry, anomaly.type),
        "severity": _map_severity(anomaly.severity),
        "resolved": False,
        "created_at": datetime.utcnow(),
    }

    alerts_collection.insert_one(alert_doc)
    return alert_id


# helper fns
def _get_trigger_value(telemetry: TelemetryState, anomaly_type: str) -> float:
    """
    Store the actual telemetry value that triggered the alert
    """
    if anomaly_type == "ENGINE_OVERHEAT":
        return telemetry.engine_temp_c
    if anomaly_type == "BRAKE_WEAR":
        return telemetry.brake_wear_percent
    if anomaly_type == "LOW_BATTERY":
        return telemetry.battery_voltage_v
    return 0.0


def _map_severity(severity: str) -> str:
    """
    Map internal severity -> DB severity enum
    """
    if severity == "CRITICAL":
        return "HIGH"
    if severity == "WARNING":
        return "MEDIUM"
    return "LOW"



# Anomaly detection logic
def detect_anomaly(telemetry: TelemetryState) -> AnomalyState | None:
    if telemetry.engine_temp_c > 110: # overheating
        return AnomalyState(
            detected=True,
            type="ENGINE_OVERHEAT",
            severity="CRITICAL" if telemetry.engine_temp_c > 120 else "WARNING",
        )

    if telemetry.brake_wear_percent > 80: # excess brake wear
        return AnomalyState(
            detected=True,
            type="BRAKE_WEAR",
            severity="WARNING",
        )

    if telemetry.battery_voltage_v < 11.8: # low battery voltage
        return AnomalyState(
            detected=True,
            type="LOW_BATTERY",
            severity="INFO",
        )

    return None
