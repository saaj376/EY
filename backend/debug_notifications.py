
from db import db
from pprint import pprint

def check_recent_logs():
    print("--- 5 Most Recent Notifications ---")
    logs = list(db.notification_logs.find().sort("timestamp", -1).limit(5))
    if not logs:
        print("No logs found.")
    for log in logs:
        print(f"Time: {log.get('timestamp')}, Status: {log.get('status')}, User: {log.get('user_id')}, Msg: {log.get('message')}")
        if log.get('status') == "FAILED":
             print(f"  Reason: {log.get('failure_reason')}")

if __name__ == "__main__":
    check_recent_logs()
