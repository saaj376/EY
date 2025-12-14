# graph.py
from typing import TypedDict, Dict
from langgraph.graph import StateGraph, END

import ml
import alerts
import twin


# -------- GRAPH STATE -------- #

class TelemetryState(TypedDict):
    telemetry: dict
    anomaly: Dict
    severity: str
    alert_id: str | None


# -------- NODES -------- #

def anomaly_node(state: TelemetryState):
    result = ml.detect_anomaly(state["telemetry"])
    state["anomaly"] = result
    return state

def severity_node(state: TelemetryState):
    if state["anomaly"]["is_anomaly"]:
        state["severity"] = ml.severity_from_score(
            state["anomaly"]["anomaly_score"]
        )
    else:
        state["severity"] = "LOW"
    return state

def alert_node(state: TelemetryState):
    if not state["anomaly"]["is_anomaly"]:
        return state

    telemetry = state["telemetry"]
    alert_id = alerts.create_alert(
        vehicle_id=telemetry["vehicle_id"],
        alert_type="ANOMALY_DETECTED",
        value=state["anomaly"]["anomaly_score"],
        severity=state["severity"]
    )

    diagnosis = ml.generate_diagnosis(telemetry)
    alerts.create_diagnosis(alert_id, diagnosis)

    state["alert_id"] = str(alert_id)
    return state

def twin_node(state: TelemetryState):
    twin.update_twin_state(
        state["telemetry"]["vehicle_id"],
        state["telemetry"]
    )
    return state


# -------- GRAPH WIRING -------- #

def build_graph():
    g = StateGraph(TelemetryState)

    g.add_node("anomaly", anomaly_node)
    g.add_node("severity", severity_node)
    g.add_node("alert", alert_node)
    g.add_node("twin", twin_node)

    g.set_entry_point("anomaly")
    g.add_edge("anomaly", "severity")
    g.add_edge("severity", "alert")
    g.add_edge("alert", "twin")
    g.add_edge("twin", END)

    return g.compile()

graph = build_graph()
