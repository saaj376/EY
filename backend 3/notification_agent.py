import json
import time
from twilio.rest import Client
from datetime import datetime
from utils import get_mongo_client,get_redis_client,Config

twilio_client=Client(
    Config.twilio_account_sid,
    Config.twilio_auth_token
)
whatsapp_from=Config.twilio_from_number

def send_whatsapp(to_number: str,message:str):
    try:
        msg=twilio_client.messages.create(
            from_=whatsapp_from,
            to=f"whatsapp:{to_number}",
            body=message
        )
        return "sent"
    except Exception as e:
        return f"FAILED: {str(e)}"

def send_voice_call(phone: str,message:str):
    print("Voice call placed to {phone}:{message}")
    return "sent"

def start_notification_worker():
    mongo=get_mongo_client()
    alerts_collection = mongo["alerts"]
    notification_logs = mongo["notification_logs"]

    print("Notification worker started")

    while True:
        try:
            alerts=alerts_collection.find(
                {"resolved": False}
            ).limit(5)

            for alert in alerts:
                alert_id = alert["_id"]
                vehicle_id = alert["vehicle_id"]
                severity = alert["severity"]
                alert_type = alert["alert_type"]
                value = alert["value"]

                customer_phone=+919444082981

                message = (
                    f"Vehicle Alert Detected\n\n"
                    f"Vehicle ID: {vehicle_id}\n"
                    f"Issue: {alert_type}\n"
                    f"Value: {value}\n"
                    f"Severity: {severity}\n\n"
                    f"Our system recommends service. "
                    f"Reply YES to proceed."
                )

                status=send_whatsapp(customer_phone,message)

                if severity == "HIGH":
                    status = send_voice_call(vehicle_id, message)
                    channel = "VOICE"
                elif severity == "MEDIUM":
                    status = send_whatsapp(vehicle_id, message)
                    channel = "WHATSAPP"
                else:
                    status = "LOGGED"
                    channel = "DASHBOARD"

                notification_logs.insert_one({
                    "alert_id": str(alert_id),
                    "vehicle_id": vehicle_id,
                    "channel": channel,
                    "message": message,
                    "status": status,
                    "timestamp": datetime.utcnow()
                })

                alerts_collection.update_one(
                    {"_id": alert_id},
                    {"$set": {"resolved": True}}
                )

        except Exception as e:
            notification_logs.insert_one({
                "alert_id": None,
                "vehicle_id": None,
                "channel": "ERROR",
                "message": str(e),
                "status": "FAILED",
                "timestamp": datetime.utcnow()
            })

        time.sleep(5)

if __name__=="__main__":
    start_notification_worker()