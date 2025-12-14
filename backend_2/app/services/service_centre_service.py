from app.connection import get_db

# service centre logic -> provide all active faults for a service centre along with diagnosis info
def get_active_faults_for_centre(service_centre_id: str):
    db = get_db()

    bookings = list(db["bookings"].find({
        "service_centre_id": service_centre_id,
        "status": {"$in": ["CONFIRMED", "IN_PROGRESS"]}
    }))

    results = []

    for booking in bookings:
        alert = db["alerts"].find_one({
            "vehicle_id": booking["vehicle_id"],
            "resolved": False
        })

        if not alert:
            continue

        diagnosis = db["diagnosis"].find_one({
            "alert_id": alert["id"]
        })

        slot = db["service_slots"].find_one({
            "id": booking["slot_id"]
        })

        # add diagnosis info too
        results.append({
            "booking_id": booking["id"],
            "vehicle_id": booking["vehicle_id"],
            "alert_type": alert["alert_type"],
            "severity": alert["severity"],
            "diagnosis": diagnosis["probable_cause"] if diagnosis else None,
            "recommended_action": diagnosis["recommendation"] if diagnosis else None,
            "status": booking["status"],
            "slot_time": slot["start_time"] if slot else None,
        })

    return results


# vehicle history logic -> provide all past alerts for a vehicle along with diagnosis and booking info if any
def get_vehicle_history(vehicle_id: str):
    db = get_db()

    alerts = list(
        db["alerts"].find(
            {"vehicle_id": vehicle_id},
            sort=[("created_at", -1)]
        )
    )

    history = []

    for alert in alerts:
        diagnosis = db["diagnosis"].find_one(
            {"alert_id": alert["id"]}
        )

        booking = db["bookings"].find_one(
            {"vehicle_id": vehicle_id, "alert_id": alert["id"]}
        )

        history.append({
            "alert_id": alert["id"],
            "alert_type": alert["alert_type"],
            "severity": alert["severity"],
            "alert_created_at": alert["created_at"],
            "resolved": alert["resolved"],

            "diagnosis": {
                "probable_cause": diagnosis["probable_cause"],
                "recommended_action": diagnosis["recommendation"],
                "confidence": diagnosis.get("confidence"),
                "urgency": diagnosis.get("urgency"),
            } if diagnosis else None,

            "booking": {
                "booking_id": booking["id"],
                "status": booking["status"],
                "service_centre_id": booking["service_centre_id"],
                "created_at": booking["created_at"],
            } if booking else None,
        })

    return history