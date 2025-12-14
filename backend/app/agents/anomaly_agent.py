from app.schemas.agent_state import AgentState, AnomalyState
from app.services.anomaly_service import detect_anomaly , alerts_to_db


def anomaly_agent(state: AgentState) -> AgentState:
    anomaly = detect_anomaly(state.telemetry)

    if anomaly:
    
        alert_id = alerts_to_db( 
            vehicle_id=state.vehicle_id,
            telemetry=state.telemetry,
            anomaly=anomaly,
        )

        # attach anomaly to state
        state.anomaly = anomaly

        state.meta.trace_id = alert_id

    else:
        state.anomaly = AnomalyState(detected=False)

    return state
