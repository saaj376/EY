from app.schemas.agent_state import DiagnosisState


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
