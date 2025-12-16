from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Phase 1
from telemetry import router as telemetry_router
from user_views import router as user_views_router
from oem import router as oem_router
from logs import router as logs_router
from telemetry_ws import router as telemetry_ws_router
from voice_agent import router as voice_router
import threading

from telemetry import router as telemetry_router
from telemetry_simulator import telemetry_simulator_loop

# Phase 3 (workflow / closure)
import rca
import capa
import service
import jobs
import invoices
from service_views import router as service_views_router
from notifications_view import router as notification_views_router
from middleware import ueba_middleware
import analytics

app = FastAPI(
    title="Vehicle Intelligence Platform",
    version="1.0",
    description="Telemetry → ML → Alerts → RCA → CAPA → Service Closure"
)

# ----------------------------
# CORS MIDDLEWARE
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(service_views_router)
app.include_router(user_views_router)
app.include_router(notification_views_router)
app.include_router(oem_router)
app.include_router(logs_router)
app.middleware("http")(ueba_middleware)
app.include_router(telemetry_ws_router)
app.include_router(voice_router)
# ----------------------------
# ROUTERS
# ----------------------------

app.include_router(
    telemetry_router,
    prefix="",
    tags=["Telemetry"]
)

# ----------------------------
# HEALTH CHECK
# ----------------------------

@app.get("/")
def root():
    return {
        "status": "RUNNING",
        "phases_enabled": ["PHASE_1", "PHASE_2", "PHASE_3"]
    }

# ----------------------------
# PHASE 3 – RCA ENDPOINTS
# ----------------------------

@app.post("/rca")
def create_rca(payload: dict):
    return {
        "rca_id": rca.create_rca(
            alert_id=payload["alert_id"],
            vehicle_id=payload["vehicle_id"],
            root_cause=payload["root_cause"],
            method=payload.get("analysis_method", "5_WHYS"),
            current_role=payload["role"]
        )
    }

# ----------------------------
# PHASE 3 – CAPA ENDPOINTS
# ----------------------------

@app.post("/capa")
def create_capa(payload: dict):
    return {
        "capa_id": capa.create_capa(
            rca_id=payload["rca_id"],
            action_type=payload["action_type"],
            description=payload["description"],
            owner_team=payload["owner_team"],
            target_date=payload["target_date"],
            current_role=payload["role"]
        )
    }

# ----------------------------
# PHASE 3 – SERVICE WORKFLOW
# ----------------------------

@app.post("/service/booking")
def create_booking(payload: dict):
    try:
        return {
            "booking_id": service.create_booking(
                vehicle_id=payload["vehicle_id"],
                user_id=payload["user_id"],
                service_centre_id=payload["service_centre_id"],
                slot_start=payload["slot_start"],
                slot_end=payload["slot_end"],
                current_role=payload["role"]
            )
        }
    except ValueError as e:
        # If the error contains alternatives, return them
        if isinstance(e.args[0], dict) and "available_alternatives" in e.args[0]:
            from fastapi import HTTPException
            raise HTTPException(status_code=409, detail=e.args[0])
        raise


# Add new endpoint to check availability before booking
@app.get("/service/availability")
def check_availability(
    service_centre_id: str,
    slot_start: str,
    slot_end: str
):
    """Check if a service centre has capacity for a given time slot"""
    return service.get_service_centre_capacity(service_centre_id, slot_start, slot_end)


@app.get("/service/centres/slots")
def get_service_centre_slots(
    service_centre_id: str,
    date: str  # YYYY-MM-DD format
):
    """Get available time slots for a specific service centre on a given date"""
    return {
        "service_centre_id": service_centre_id,
        "date": date,
        "slots": service.generate_available_slots(service_centre_id, date)
    }


@app.get("/service/centres/available")
def get_available_centres_with_slots(
    date: str  # YYYY-MM-DD format
):
    """Get all service centres with their available slots for a given date"""
    return {
        "date": date,
        "service_centres": service.get_available_service_centres_with_slots(date)
    }


@app.post("/service/job")
def create_job(payload: dict):
    return {
        "job_id": jobs.create_job_card(
            booking_id=payload["booking_id"],
            notes=payload.get("notes", ""),
            current_role=payload["role"]
        )
    }

@app.post("/service/invoice")
def create_invoice(payload: dict):
    return {
        "invoice_id": invoices.create_invoice(
            job_card_id=payload["job_card_id"],
            parts=payload["parts"],
            labour_cost=payload["labour_cost"],
            tax=payload["tax"],
            current_role=payload["role"]
        )
    }

@app.post("/service/booking/cancel")
def cancel_booking(payload: dict):
    service.cancel_booking(
        booking_id=payload["booking_id"],
        reason=payload.get("reason", "User cancelled"),
        current_role=payload["role"]
    )
    return {"status": "cancelled"}

# ----------------------------
# ANALYTICS ENDPOINTS
# ----------------------------

@app.get("/analytics")
def get_analytics():
    """Get comprehensive analytics data"""
    return {
        "anomaly_score_stats": analytics.anomaly_score_stats(),
        "alert_rate": analytics.alert_rate(),
        "mean_time_to_detect": analytics.mean_time_to_detect(),
        "anomaly_to_rca_rate": analytics.anomaly_to_rca_rate(),
        "false_positive_rate": analytics.false_positive_rate(),
        "alert_trend": analytics.alert_trend(),
        "severity_distribution": analytics.severity_distribution(),
        "rca_closure_rate": analytics.rca_closure_rate(),
        "overdue_capa": analytics.overdue_capa(),
    }

# ----------------------------
# TEST ENDPOINT
# ----------------------------

@app.post("/telemetry/test")
def seed_test_data():
    from redis_client import set_telemetry
    from datetime import datetime
    
    test_data = {
        "vehicle_id": "VIN123456",
        "timestamp": datetime.utcnow().isoformat(),
        "speed": 65.5,
        "rpm": 2800,
        "fuel_level": 75.0,
        "engine_temp": 92,
        "battery_voltage": 12.8,
    }
    set_telemetry("VIN123456", test_data)
    return {"status": "seeded"}

# ----------------------------
# RUN SERVER
# ----------------------------

@app.on_event("startup")
def start_background_services():
    threading.Thread(
        target=telemetry_simulator_loop,
        daemon=True
    ).start()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)