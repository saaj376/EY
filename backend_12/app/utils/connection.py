import os
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")


client: AsyncIOMotorClient | None = None

def connect_to_mongo():
    global client
    client = AsyncIOMotorClient(MONGO_URI)
    print("Mongo client initialized")


async def get_db():
    if client is None:
        raise RuntimeError("Mongo client not initialized")
    return client["EY_hacky"]


def close_mongo_connection():
    global client
    if client:
        client.close()
        client = None
        print("MongoDB connection closed")
