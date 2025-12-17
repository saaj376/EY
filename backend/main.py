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
    title="Autosphere",
    version="1.0",
    description="Intelligent Vehicle Management Platform"
)



# ----------------------------
# ENHANCED SERVICE CENTRE ENDPOINTS  
# ----------------------------

@app.get('/service/centres')
def get_all_centres():
    '''Get all service centres'''
    import service
    return service.get_all_service_centres()

@app.put('/service/booking/{booking_id}/status')
def update_booking_status(booking_id: str, payload: dict):
    '''Update booking status'''
    import service
    service.update_booking_status(
        booking_id=booking_id,
        status=payload['status'],
        notes=payload.get('notes', ''),
        current_role=payload['role']
    )
    return {'status': 'success'}
# ----------------------------
# ENHANCED SERVICE CENTRE ENDPOINTS  
# ----------------------------

@app.get('/service/centres')
def get_all_centres():
    '''Get all service centres'''
    import service
    return service.get_all_service_centres()

@app.put('/service/booking/{booking_id}/status')
def update_booking_status(booking_id: str, payload: dict):
    '''Update booking status'''
    import service
    service.update_booking_status(
        booking_id=booking_id,
        status=payload['status'],
        notes=payload.get('notes', ''),
        current_role=payload['role']
    )
    return {'status': 'success'}
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
# PHASE 3 â€“ RCA ENDPOINTS
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
# PHASE 3 â€“ CAPA ENDPOINTS
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
# PHASE 3 â€“ SERVICE WORKFLOW
# ----------------------------

# ----------------------------
# PHASE 3 – SERVICE WORKFLOW
# ----------------------------

# Note: Booking creation and other service workflows are handled 
# both here and in service_views.py. 
# We are delegating to service_views_router for clarity and robustness.
# Keeping only unique global endpoints if any.


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


