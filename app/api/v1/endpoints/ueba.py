from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.ueba import UEBAEvent
from app.schemas.ueba import UEBAEventCreate, UEBAEventResponse

router = APIRouter()

@router.post("/", response_model=UEBAEventResponse)
def log_ueba_event(
    *,
    db: Session = Depends(deps.get_db),
    event_in: UEBAEventCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Log a UEBA event.
    """
    if event_in.risk_score > 80.0:
        # Logic to block user or flag them
        pass

    event = UEBAEvent(
        user_id=current_user.id,
        action=event_in.action,
        ip_address=event_in.ip_address,
        risk_score=event_in.risk_score,
        details=event_in.details,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/", response_model=List[UEBAEventResponse])
def read_ueba_events(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Read UEBA events (Admin only).
    """
    events = db.query(UEBAEvent).offset(skip).limit(limit).all()
    return events
