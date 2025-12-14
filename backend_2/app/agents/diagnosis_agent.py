from app.schemas.agent_state import AgentState
from app.services.diagnosis_service import diagnose_anomaly
from app.services.diagnosis_service import diagnosis_to_db

def diagnosis_agent(state: AgentState) -> AgentState:
    if not state.anomaly or not state.anomaly.detected: # if no anomaly detected -> skip diagnosis
        return state

    diagnosis = diagnose_anomaly(state.anomaly.type)
    state.diagnosis = diagnosis

    diagnosis_to_db(
        alert_id=state.meta.trace_id,
        diagnosis=diagnosis,
        confidence=0.9,  # mocked
    )

    return state
