from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.connection import connect_to_mongo, close_mongo_connection
from app.api.telemetry import router as telemetry_router
from app.api.booking import router as booking_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    yield
    close_mongo_connection()


app = FastAPI(
    title="EY_hacky",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(telemetry_router)
app.include_router(booking_router)

@app.get("/")
async def ping():
    return {"message": "hello~"}


