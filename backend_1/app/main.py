from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, customer, vehicles, twin, oem

app = FastAPI(
    title="Vehicle Health Monitoring Master Agent",
    description="Master Agent API for Vehicle Health Monitoring and Service Orchestration",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event Handlers
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

# Routers
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(vehicles.router)
app.include_router(twin.router)
app.include_router(oem.router)

@app.get("/")
async def root():
    return {"message": "Master Agent Service is Running"}
