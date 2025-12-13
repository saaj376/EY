from langgraph.graph import StateGraph, END
from app.schemas.agent_state import AgentState
from app.agents.anomaly_agent import anomaly_agent
from app.agents.diagnosis_agent import diagnosis_agent


def route_after_anomaly(state: AgentState):
    if state.anomaly and state.anomaly.detected:
        return "diagnosis_agent"
    return END


def build_master_graph():
    graph = StateGraph(AgentState)

    # Nodes (agents)
    graph.add_node("anomaly_agent", anomaly_agent)
    graph.add_node("diagnosis_agent", diagnosis_agent)

    # Entry point
    graph.set_entry_point("anomaly_agent")

    # Conditional routing
    graph.add_conditional_edges(
        "anomaly_agent",
        route_after_anomaly,
        {
            "diagnosis_agent": "diagnosis_agent",
            END: END,
        }
    )

    # End after diagnosis
    graph.add_edge("diagnosis_agent", END)

    return graph.compile()
