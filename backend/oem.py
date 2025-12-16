from fastapi import APIRouter, Depends
from auth import get_current_role, require_roles
from utils import UserRole
import analytics
import db

router = APIRouter(prefix="/oem", tags=["OEM Dashboard"])

@router.get("/dashboard")
def oem_dashboard(role=Depends(get_current_role)):
    require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

    return {
        "alert_trend": analytics.alert_trend(7),
        "severity_distribution": analytics.severity_distribution(),
        "rca_status": analytics.rca_closure_rate(),
        "overdue_capa": analytics.overdue_capa()
    }


@router.get("/high-risk-vehicles")
def high_risk_vehicles(role=Depends(get_current_role)):
    require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

    pipeline = [
        {
            "$group": {
                "_id": "$vehicle_id",
                "alert_count": {"$sum": 1}
            }
        },
        {"$sort": {"alert_count": -1}},
        {"$limit": 10}
    ]

    return list(db.alerts.aggregate(pipeline))

@router.get("/security/ueba")
def ueba_dashboard(role=Depends(get_current_role)):
    require_roles(role, [UserRole.OEM_ADMIN])

    return list(
        db.alerts.find(
            {"alert_type": "UEBA_SECURITY"},
            {"_id": 0}
        ).sort("timestamp", -1)
    )
