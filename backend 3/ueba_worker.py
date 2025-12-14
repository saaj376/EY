import time
from datetime import datetime, timedelta
import joblib
import pandas as pd
from utils import get_mongo_client

model=joblib.load("ueba_model.pkl")
window_minutes=5
sleep_interval=15

def start_ueba_worker():
    mongo=get_mongo_client()
    api_usage=mongo['api_usage']
    ueba_events=mongo['ueba_events']
    
    while True:
        try:
            window_start=datetime.utcnow()-timedelta(minutes=window_minutes)
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": window_start}
                    }
                },
                {
                    "$group": {
                        "_id": "$user_id",
                        "total_requests": {"$sum": 1},
                        "unique_endpoints": {"$addToSet": "$endpoint"},
                        "unique_ips": {"$addToSet": "$ip_address"}
                    }
                }
            ]
            for doc in api_usage.aggregate(pipeline):
                features = {
                    "total_requests": doc["total_requests"],
                    "unique_endpoints": len(doc["unique_endpoints"]),
                    "unique_ips": len(doc["unique_ips"]),
                    "avg_requests_per_min": doc["total_requests"]/window_minutes
                }
                x=pd.DataFrame([features])

                prediction=model.predict(x)[0]
                score=model.decision_function(x)[0]

                if prediction == -1:
                    ueba_events.insert_one({
                        "user_id": doc["_id"],
                        "event_type": "ML_BEHAVIOR_ANOMALY",
                        "risk_score": round(abs(score), 2),
                        "description": (
                            f"Abnormal API usage detected in last "
                            f"{window_minutes} minutes"
                        ),
                        "features": features,
                        "detected_at": datetime.utcnow()
                    })

                    print(
                        f"UEBA anomaly | user={doc['_id']} | "
                        f"risk={round(abs(score), 2)}"
                    )
        except Exception as e:
            ueba_events.insert_one({
                "user_id": None,
                "event_type": "UEBA_WORKER_ERROR",
                "risk_score": 0.9,
                "description": str(e),
                "detected_at": datetime.utcnow()
            })

        time.sleep(sleep_interval)


if __name__ == "__main__":
    start_ueba_worker()