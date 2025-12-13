from app.schemas.agent_state import AgentState, AnomalyState
from app.services.anomaly_service import detect_anomaly


def anomaly_agent(state: AgentState) -> AgentState:
    anomaly = detect_anomaly(state.telemetry)

    if anomaly:
        state.anomaly = anomaly
    else:
        state.anomaly = AnomalyState(detected=False)

    return state
