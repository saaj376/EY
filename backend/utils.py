import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import ConnectionFailure as PyMongoConnectionError
import redis

load_dotenv()

class Config:
    mongouri=os.getenv("MONGO_URI")
    dbname=os.getenv("DB_NAME")
    collection_vehicles="vehicles"
    telemetry_collection="telemetry_events"
    worker_logs_collection="worker_logs"
    notification_logs_collection="notification_logs"
    api_usage_collection="api_usage"
    ws_sessions_collection="ws_sessions"
    queuetype=os.getenv("QUEUE_TYPE")
    redishost=os.getenv("REDIS_HOST")
    redisport=int(os.getenv("REDIS_PORT"))
    telemetryqueuename=os.getenv("TELEMETRY_QUEUE_NAME")
    twilio_account_sid=os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth_token=os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from_number=os.getenv("TWILIO_FROM_NUMBER")
    ws_host = os.getenv("WS_HOST")
    ws_port = int(os.getenv("WS_PORT"))

def get_mongo_client():
    try:
        client=MongoClient(
            Config.mongouri,
            server_api=ServerApi('1')
        )
        client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas.")
        db=client[Config.dbname]
        return {
            "client": client,
            "db": db,
            "telemetry_events": db[Config.telemetry_collection],
            "worker_logs": db[Config.worker_logs_collection],
            "notification_logs": db[Config.notification_logs_collection],
            "api_usage": db[Config.api_usage_collection],
            "ws_sessions": db[Config.ws_sessions_collection],
        }
        
    
    except PyMongoConnectionError as e:
        print(f"FATAL ERROR: Could not connect to MongoDB. Check URI and IP Access List: {e}")
        exit(1)
    except Exception as e:
        print(f"An unexpected error occurred during MongoDB setup: {e}")
        exit(1)

def get_redis_client():
    try:
        r=redis.Redis(
            host=Config.redishost,
            port=Config.redisport,
            decode_responses=True
        )
        r.ping()
        print("Connected to redis")
        return r
    except Exception as e:
        print(f"Redis Connection failed {e}")
        exit(1)

get_mongo_client()
get_redis_client()
