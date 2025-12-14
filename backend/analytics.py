# analytics.py
from db import telemetry_col, db
import numpy as np
import ml
from db import db
from datetime import datetime, timedelta

if db is None:
    telemetry_col = None
    alerts_col = None
    rca_col = None
    capa_col = None
else:
    telemetry_col = db.telemetry_events
    alerts_col = db.alerts
    rca_col = db.rca
    capa_col = db.capa_actions

def anomaly_score_stats(limit=1000):
    if telemetry_col is None:
        return {
            "count": 0,
            "mean_score": 0.0,
            "min_score": 0.0,
            "max_score": 0.0,
            "anomaly_rate": 0.0
        }
    
    cursor = telemetry_col.find().sort("timestamp", -1).limit(limit)

    scores = []
    for t in cursor:
        try:
            result = ml.detect_anomaly(t)
            scores.append(result["anomaly_score"])
        except:
            continue

    if len(scores) == 0:
        return {
            "count": 0,
            "mean_score": 0.0,
            "min_score": 0.0,
            "max_score": 0.0,
            "anomaly_rate": 0.0
        }

    return {
        "count": len(scores),
        "mean_score": float(np.mean(scores)),
        "min_score": float(np.min(scores)),
        "max_score": float(np.max(scores)),
        "anomaly_rate": sum(1 for s in scores if s < 0) / len(scores) if len(scores) > 0 else 0.0
    }
def alert_rate():
    if telemetry_col is None or alerts_col is None:
        return 0.0
    total = telemetry_col.count_documents({})
    alerts = alerts_col.count_documents({})
    return alerts / max(total, 1)

def mean_time_to_detect():
    if telemetry_col is None:
        return 0.0
    pipeline = [
        {
            "$lookup": {
                "from": "alerts",
                "localField": "vehicle_id",
                "foreignField": "vehicle_id",
                "as": "alerts"
            }
        },
        {"$unwind": "$alerts"},
        {
            "$project": {
                "latency": {
                    "$subtract": ["$alerts.timestamp", "$timestamp"]
                }
            }
        }
    ]
    results = list(telemetry_col.aggregate(pipeline))
    return sum(r["latency"] for r in results) / max(len(results), 1)
def anomaly_to_rca_rate():
    if alerts_col is None or rca_col is None:
        return 0.0
    anomalies = alerts_col.count_documents({"alert_type": "ANOMALY_DETECTED"})
    rcas = rca_col.count_documents({})
    return rcas / max(anomalies, 1)

def false_positive_rate():
    if alerts_col is None:
        return 0.0
    false_pos = alerts_col.count_documents({"feedback": "FALSE_POSITIVE"})
    total = alerts_col.count_documents({})
    return false_pos / max(total, 1)


def alert_trend(days=7):
    if alerts_col is None:
        return []
    since = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    return list(alerts_col.aggregate(pipeline))

def severity_distribution():
    if alerts_col is None:
        return []
    pipeline = [
        {
            "$group": {
                "_id": "$severity",
                "count": {"$sum": 1}
            }
        }
    ]
    return list(alerts_col.aggregate(pipeline))

def rca_closure_rate():
    if rca_col is None:
        return {
            "total_rca": 0,
            "closed_rca": 0,
            "closure_rate": 0
        }
    total = rca_col.count_documents({})
    closed = rca_col.count_documents({"status": "CLOSED"})

    return {
        "total_rca": total,
        "closed_rca": closed,
        "closure_rate": (closed / total) if total else 0
    }

def overdue_capa():
    if capa_col is None:
        return []
    today = datetime.utcnow()

    return list(capa_col.find(
        {"status": {"$ne": "COMPLETED"}, "target_date": {"$lt": today}},
        {"_id": 0}
    ))
