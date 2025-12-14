from app.schemas.agent_state import (
    AgentState,
    TelemetryState,
    MetaState
)
from app.graphs.master_graph import build_master_graph


if __name__ == "__main__":
    # Sample telemetry with ENGINE OVERHEAT
    telemetry = TelemetryState(
        vehicle_id="V102",
        timestamp="2025-12-13T12:35:21Z",
        speed_kmph=78,
        rpm=2600,
        engine_temp_c=125,   # triggers anomaly
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

    # Initial agent state
    state = AgentState(
        vehicle_id="V102",
        telemetry=telemetry,
        meta=MetaState()
    )

    # Build and run LangGraph
    graph = build_master_graph()
    final_state = graph.invoke(state)

    # Print final agent state
    print(final_state)
