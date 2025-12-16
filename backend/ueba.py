from datetime import datetime, timedelta
from db import db

usage_col = db.api_usage
alerts_col = db.alerts

def log_api_usage(user_id, role, endpoint):
    today = datetime.utcnow().date()

    usage_col.update_one(
        {
            "user_id": user_id,
            "endpoint": endpoint,
            "date": today
        },
        {
            "$inc": {"count": 1},
            "$setOnInsert": {
                "role": role,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

def detect_ueba_risk(user_id):
    since = datetime.utcnow().date() - timedelta(days=7)

    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": since}}},
        {
            "$group": {
                "_id": "$endpoint",
                "total_calls": {"$sum": "$count"}
            }
        }
    ]

    data = list(usage_col.aggregate(pipeline))

    risks = []

    for d in data:
        if d["total_calls"] > 500:   # threshold
            risks.append({
                "type": "API_ABUSE",
                "endpoint": d["_id"],
                "count": d["total_calls"]
            })

    return risks
