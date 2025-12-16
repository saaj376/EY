# from fastapi import APIRouter, Depends, HTTPException
# from datetime import datetime
# from auth import get_current_role, require_roles
# from utils import validate_telemetry, UserRole
# from redis_client import set_telemetry, get_telemetry
# from db import telemetry_col

# router = APIRouter()

# @router.post("/telemetry")
# def ingest_telemetry(
#     payload: dict,
#     role=Depends(get_current_role)
# ):
#     require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

#     validate_telemetry(payload)

#     payload["timestamp"] = payload.get(
#         "timestamp",
#         datetime.utcnow().isoformat()
#     )

#     # 🔁 Push to Redis (edge buffer)
#     set_telemetry(payload["vehicle_id"], payload)

#     return {
#         "status": "queued",
#         "vehicle_id": payload["vehicle_id"]
#     }

# @router.get("/telemetry/live/{vehicle_id}")
# def get_live_telemetry(
#     vehicle_id: str,
#     role=Depends(get_current_role)
# ):
#     require_roles(
#         role,
#         [
#             UserRole.CUSTOMER,
#             UserRole.SERVICE_CENTER,
#             UserRole.OEM_ADMIN,
#             UserRole.OEM_ANALYST
#         ]
#     )

#     telemetry = get_telemetry(vehicle_id)
#     if not telemetry:
#         raise HTTPException(
#             status_code=404,
#             detail="Live telemetry not available"
#         )

#     return telemetry


# @router.get("/telemetry/history/{vehicle_id}")
# def get_telemetry_history(
#     vehicle_id: str,
#     limit: int = 50,
#     role=Depends(get_current_role)
# ):
#     require_roles(
#         role,
#         [
#             UserRole.CUSTOMER,
#             UserRole.SERVICE_CENTER,
#             UserRole.OEM_ADMIN,
#             UserRole.OEM_ANALYST
#         ]
#     )

#     return list(
#         telemetry_col.find(
#             {"vehicle_id": vehicle_id},
#             {"_id": 0}
#         )
#         .sort("timestamp", -1)
#         .limit(limit)
#     )


from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from auth import get_current_role, require_roles
from utils import validate_telemetry, UserRole
from redis_client import set_telemetry, get_telemetry
from db import telemetry_col
from simulator import telemetry_simulator



router = APIRouter()

@router.post("/telemetry")
def ingest_telemetry(payload: dict, role=Depends(get_current_role)):
    require_roles(role, [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST])

    validate_telemetry(payload)
    payload["timestamp"] = datetime.utcnow().isoformat()

    set_telemetry(payload["vehicle_id"], payload)
    telemetry_col.insert_one(payload)


    return {"status": "queued", "vehicle_id": payload["vehicle_id"]}


@router.get("/telemetry/live/{vehicle_id}")
def get_live_telemetry(vehicle_id: str, role=Depends(get_current_role)):
    require_roles(
        role,
        [
            UserRole.CUSTOMER,
            UserRole.SERVICE_CENTER,
            UserRole.OEM_ADMIN,
            UserRole.OEM_ANALYST,
        ],
    )

    telemetry = get_telemetry(vehicle_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Live telemetry not available")

    return telemetry


@router.get("/telemetry/history/{vehicle_id}")
def get_telemetry_history(vehicle_id: str, limit: int = 50, role=Depends(get_current_role)):
    require_roles(
        role,
        [
            UserRole.CUSTOMER,
            UserRole.SERVICE_CENTER,
            UserRole.OEM_ADMIN,
            UserRole.OEM_ANALYST,
        ],
    )

    return list(
        telemetry_col.find({"vehicle_id": vehicle_id}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )

