from app.schemas.agent_state import (
    AgentState,
    TelemetryState,
    MetaState
)
from app.agents.anomaly_agent import anomaly_agent


if __name__ == "__main__":
    telemetry = TelemetryState(
        vehicle_id="V102",
        timestamp="2025-12-13T12:35:21Z",
        speed_kmph=78,
        rpm=2600,
        engine_temp_c=125,
        coolant_temp_c=92,
        brake_wear_percent=42,
        battery_voltage_v=12.4,
        fuel_level_percent=63,
        throttle_position_percent=34,
        acceleration_mps2=1.8,
        gear=4,
        odometer_km=25460,
        latitude=12.9716,
        longitude=77.5946,
        engine_status="ON"
    )

    state = AgentState(
        vehicle_id="V102",
        telemetry=telemetry,
        meta=MetaState()
    )

    updated_state = anomaly_agent(state)

    print(updated_state.model_dump())
