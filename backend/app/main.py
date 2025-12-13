from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.connection import connect_to_mongo, close_mongo_connection


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


@app.get("/")
async def ping():
    return {"message": "hello~"}


