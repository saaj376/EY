from langgraph.graph import StateGraph, END

from app.schemas.agent_state import AgentState
from app.agents.anomaly_agent import anomaly_agent
from app.agents.diagnosis_agent import diagnosis_agent
from app.agents.scheduling_agent import scheduling_agent


# routing fns
def route_after_anomaly(state: AgentState):
    if state.anomaly and state.anomaly.detected:
        return "diagnosis"
    return END


def route_after_diagnosis(state: AgentState):
    if not state.diagnosis:
        return END

    if state.diagnosis.urgency == "INFO":
        return END

    return "scheduling"



def build_master_graph():
    graph = StateGraph(AgentState)


    graph.add_node("anomaly", anomaly_agent)
    graph.add_node("diagnosis", diagnosis_agent)
    graph.add_node("scheduling", scheduling_agent)


    graph.set_entry_point("anomaly")


    graph.add_conditional_edges(
        "anomaly",
        route_after_anomaly,
        {
            "diagnosis": "diagnosis",
            END: END,
        }
    )

    graph.add_conditional_edges(
        "diagnosis",
        route_after_diagnosis,
        {
            "scheduling": "scheduling",
            END: END,
        }
    )


    graph.add_edge("scheduling", END)

    return graph.compile()
