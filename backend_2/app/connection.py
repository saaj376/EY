import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client: MongoClient | None = None


def connect_to_mongo():
    global client
    client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
    print("Mongo client initialized")


def get_db():
    if client is None:
        raise RuntimeError("Mongo client not initialized")
    return client["EY_hacky"]


def close_mongo_connection():
    global client
    if client:
        client.close()
        client = None
        print("MongoDB connection closed")
