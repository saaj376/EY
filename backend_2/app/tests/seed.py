from datetime import date, time, timedelta
from uuid import uuid4

from app.connection import connect_to_mongo, close_mongo_connection, get_db


def seed_service_centres(db):
    centres = [
        {
            "id": "SC001",
            "name": "OEM Service Center - Bangalore",
            "location": "Bangalore",
            "contact": "9999999999",
            "daily_capacity": 5,
        },
        {
            "id": "SC002",
            "name": "OEM Service Center - Chennai",
            "location": "Chennai",
            "contact": "8888888888",
            "daily_capacity": 3,
        },
    ]

    db["service_centres"].delete_many({})
    db["service_centres"].insert_many(centres)
    print("Seeded service_centres")

from datetime import datetime, date, time, timedelta
from uuid import uuid4


def seed_service_slots(db):
    db["service_slots"].delete_many({})

    today = date.today()
    tomorrow = today + timedelta(days=1)

    slots = []

    for centre_id in ["SC001", "SC002"]:
        for slot_date in [today, tomorrow]:
            slots.extend([
                {
                    "id": uuid4().hex,
                    "service_centre_id": centre_id,
                    "start_time": datetime.combine(slot_date, time(10, 0)),
                    "end_time": datetime.combine(slot_date, time(11, 0)),
                    "is_available": True,
                },
                {
                    "id": uuid4().hex,
                    "service_centre_id": centre_id,
                    "start_time": datetime.combine(slot_date, time(11, 0)),
                    "end_time": datetime.combine(slot_date, time(12, 0)),
                    "is_available": True,
                },
                {
                    "id": uuid4().hex,
                    "service_centre_id": centre_id,
                    "start_time": datetime.combine(slot_date, time(14, 0)),
                    "end_time": datetime.combine(slot_date, time(15, 0)),
                    "is_available": True,
                },
            ])

    db["service_slots"].insert_many(slots)
    print("Seeded service_slots")


def main():
    connect_to_mongo()
    db = get_db()

    seed_service_centres(db)
    seed_service_slots(db)

    close_mongo_connection()


if __name__ == "__main__":
    main()
