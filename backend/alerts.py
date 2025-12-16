# alerts.py
from db import db
from datetime import datetime
from notifications import notify_user, notify_service_centre
from db import db
from voice_agent import trigger_voice_call

alerts_col = db.alerts
diagnosis_col = db.diagnosis



def create_alert(vehicle_id, alert_type, value, severity):
    alert = {
        "vehicle_id": vehicle_id,
        "timestamp": datetime.utcnow(),
        "alert_type": alert_type,
        "value": value,
        "severity": severity,
        "resolved": False
    }

    alert_id = alerts_col.insert_one(alert).inserted_id

    # 🔔 Notify vehicle owner
    vehicle = db.vehicles.find_one({"_id": vehicle_id})
    if vehicle:
        notify_user(
            user_id=vehicle["owner_user_id"],
            message=f"Alert detected: {alert_type} (Severity: {severity})"
        )
    if severity == "HIGH" :
        vehicle = db.vehicles.find_one({"_id": vehicle_id})
        if vehicle:
            user = db.users.find_one({"_id": vehicle["owner_user_id"]})
            if user and user.get("phone"):
                trigger_voice_call(user["phone"])

    return alert_id


def create_diagnosis(alert_id, diagnosis: dict):
    if not diagnosis:
        return

    diagnosis_doc = {
        "alert_id": alert_id,
        "probable_cause": diagnosis["probable_cause"],
        "recommendation": diagnosis["recommendation"],
        "confidence": diagnosis["confidence"],
        "created_at": datetime.utcnow()
    }

    diagnosis_col.insert_one(diagnosis_doc)
    alert = alerts_col.find_one({"_id": alert_id})
    if not alert:
        return

    vehicle = db.vehicles.find_one({"_id": alert["vehicle_id"]})
    if not vehicle:
        return

    notify_user(
        user_id=vehicle["owner_user_id"],
        message=f"Diagnosis available: {diagnosis['probable_cause']}. Recommendation: {diagnosis['recommendation']}"
    )
    if alert["severity"] == "HIGH":
        booking = db.bookings.find_one(
            {"vehicle_id": alert["vehicle_id"], "status": {"$ne": "CANCELLED"}}
        )
        if booking:
            notify_service_centre(
                service_centre_id=booking["service_centre_id"],
                message=f"High severity alert requires attention for vehicle {alert['vehicle_id']}"
            )

