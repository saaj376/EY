from app.schemas.agent_state import TelemetryState, AnomalyState


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
