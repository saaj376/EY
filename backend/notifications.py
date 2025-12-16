from datetime import datetime
from db import db
from twilio_client import send_sms


# Collection
notification_col = db.notification_logs


def _insert_notification(payload: dict):
    payload["timestamp"] = datetime.utcnow()
    payload["status"] = "QUEUED"  # QUEUED | SENT | FAILED
    notification_col.insert_one(payload)


def notify_user(
    user_id: str,
    message: str,
    category: str = "INFO",
    channel: str = "SMS",
):
    # Fetch user's phone number
    user = db.users.find_one({"_id": user_id})
    phone = user.get("phone") if user else None

    print(
        f"[notify_user] user_id={user_id}, channel={channel}, "
        f"has_user={bool(user)}, has_phone={bool(phone)}"
    )

    notification = {
        "user_id": user_id,
        "channel": channel,
        "category": category,
        "message": message,
        "status": "QUEUED",
    }

    try:
        if channel == "SMS" and phone:
            print(f"[notify_user] Attempting SMS to {phone}")
            send_sms(phone, message)
            notification["status"] = "SENT"
            print("[notify_user] SMS sent successfully")
        else:
            notification["status"] = "QUEUED"
            if not user:
                print(f"[notify_user] No user found for user_id={user_id}")
            elif not phone:
                print(f"[notify_user] No phone number for user_id={user_id}")
            else:
                print(
                    f"[notify_user] Channel '{channel}' is not SMS, "
                    "skipping direct Twilio send"
                )

    except Exception as e:
        notification["status"] = "FAILED"
        notification["failure_reason"] = str(e)
        print(f"[notify_user] Failed to send notification: {e}")

    notification["timestamp"] = datetime.utcnow()
    notification_col.insert_one(notification)


def notify_service_centre(
    service_centre_id: str,
    message: str,
    category: str = "INFO",
    channel: str = "SMS"
):
    _insert_notification({
        "service_centre_id": service_centre_id,
        "channel": channel,
        "category": category,
        "message": message
    })


def notify_oem_security(
    message: str,
    severity: str = "HIGH"
):
    _insert_notification({
        "oem_security": True,
        "severity": severity,
        "channel": "SYSTEM",
        "category": "SECURITY",
        "message": message
    })


def mark_notification_sent(notification_id):
    notification_col.update_one(
        {"_id": notification_id},
        {
            "$set": {
                "status": "SENT",
                "delivered_at": datetime.utcnow()
            }
        }
    )


def mark_notification_failed(notification_id, reason: str):
    notification_col.update_one(
        {"_id": notification_id},
        {
            "$set": {
                "status": "FAILED",
                "failure_reason": reason,
                "updated_at": datetime.utcnow()
            }
        }
    )

def get_user_notifications(user_id: str, limit: int = 50):
    return list(
        notification_col.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit)
    )


def get_service_centre_notifications(service_centre_id: str, limit: int = 50):
    return list(
        notification_col.find(
            {"service_centre_id": service_centre_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit)
    )


def get_oem_security_notifications(limit: int = 100):
    return list(
        notification_col.find(
            {"category": "SECURITY"},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit)
    )
