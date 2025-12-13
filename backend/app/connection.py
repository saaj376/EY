import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client: MongoClient | None = None
db = None


def connect_to_mongo():
    global client, db
    client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
    client.admin.command("ping")
    db = client["EY_hacky"]
    print("Connected to MongoDB")


def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")
