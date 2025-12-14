from app.schemas.agent_state import DiagnosisState
from uuid import uuid4
from datetime import datetime
from app.connection import get_db

def diagnosis_to_db(alert_id: str,diagnosis: DiagnosisState,confidence: float) -> str:
    """
    Persists diagnosis and returns diagnosis_id
    """
    db = get_db()
    diagnosis_collection = db["diagnosis"]

    diagnosis_id = uuid4().hex
    confidence = _confidence_from_urgency(diagnosis.urgency)

    doc = {
        "id": diagnosis_id,
        "alert_id": alert_id,
        "probable_cause": diagnosis.probable_cause,
        "recommendation": diagnosis.recommended_action,
        "confidence": confidence,
        "created_at": datetime.utcnow(),
    }

    diagnosis_collection.insert_one(doc)
    return diagnosis_id

# helper fn

def _confidence_from_urgency(urgency: str) -> float:
    if urgency == "CRITICAL":
        return 0.9
    if urgency == "WARNING":
        return 0.7
    return 0.5




# core logic
def diagnose_anomaly(anomaly_type: str) -> DiagnosisState:
    if anomaly_type == "ENGINE_OVERHEAT":
        return DiagnosisState(
            probable_cause="Coolant pump failure or coolant leak",
            recommended_action="Stop vehicle and service immediately",
            urgency="CRITICAL"
        )

    if anomaly_type == "BRAKE_WEAR":
        return DiagnosisState(
            probable_cause="Brake pads worn due to usage",
            recommended_action="Schedule brake pad replacement",
            urgency="WARNING"
        )

    if anomaly_type == "LOW_BATTERY":
        return DiagnosisState(
            probable_cause="Battery degradation",
            recommended_action="Inspect battery health",
            urgency="INFO"
        )

    return DiagnosisState(
        probable_cause="Unknown issue",
        recommended_action="General inspection recommended",
        urgency="INFO"
    )
