from app.schemas.agent_state import AgentState
from app.services.diagnosis_service import diagnose_anomaly


def diagnosis_agent(state: AgentState) -> AgentState:
    if not state.anomaly or not state.anomaly.detected: # if no anomaly detected -> skip diagnosis
        return state

    diagnosis = diagnose_anomaly(state.anomaly.type)
    state.diagnosis = diagnosis

    return state
