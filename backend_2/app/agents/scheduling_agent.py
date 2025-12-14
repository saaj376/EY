from app.schemas.agent_state import AgentState, BookingState
from app.services.scheduling_service import schedule_service


def scheduling_agent(state: AgentState) -> AgentState:
    # No diagnosis or INFO -> no booking
    if not state.diagnosis or state.diagnosis.urgency == "INFO":
        return state

    booking = schedule_service(
        vehicle_id=state.vehicle_id,
        user_id=None,  # add after suki finishes auth pls dont forget😭
        diagnosis=state.diagnosis,
    )

    if booking:
        state.booking = BookingState(
            booking_id=booking["booking_id"],
            service_centre=booking["service_centre"],
            date=booking["date"],
            start_time=booking["start_time"],
            status="CONFIRMED"
        )

    return state
