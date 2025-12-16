# Backend: Service Centre Booking with Slots Management
# File: backend/service.py

from db import db
from datetime import datetime, timedelta
from auth import require_roles
from utils import UserRole
from notifications import notify_service_centre
from bson import ObjectId

service_centres_col = db.service_centres
bookings_col = db.bookings


def create_service_centre(name, location, contact, current_role, max_capacity=5):
    require_roles(current_role, [UserRole.OEM_ADMIN])

    centre = {
        'name': name,
        'location': location,
        'contact': contact,
        'max_capacity': max_capacity,
        'working_hours': {
            'start': '09:00',
            'end': '18:00'
        },
        'slot_duration_minutes': 60,
        'working_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
    return str(service_centres_col.insert_one(centre).inserted_id)


def get_all_service_centres():
    '''Get all service centres with basic information'''
    centres = list(service_centres_col.find({}))
    for centre in centres:
        centre['_id'] = str(centre['_id'])
    return centres


def generate_available_slots(service_centre_id, date):
    '''Generate available time slots for a specific date at a service centre'''
    if isinstance(service_centre_id, str):
        service_centre_id = ObjectId(service_centre_id)
    
    centre = service_centres_col.find_one({'_id': service_centre_id})
    if not centre:
        raise ValueError('Service centre not found')
    
    max_capacity = centre.get('max_capacity', 5)
    slot_duration = centre.get('slot_duration_minutes', 60)
    working_hours = centre.get('working_hours', {'start': '09:00', 'end': '18:00'})
    
    # Parse date
    if isinstance(date, str):
        date = datetime.fromisoformat(date.split('T')[0])
    
    # Check if it's a working day
    day_name = date.strftime('%A')
    working_days = centre.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    if day_name not in working_days:
        return []
    
    # Generate time slots
    start_hour, start_min = map(int, working_hours['start'].split(':'))
    end_hour, end_min = map(int, working_hours['end'].split(':'))
    
    slots = []
    current_time = datetime.combine(date, datetime.min.time()).replace(hour=start_hour, minute=start_min)
    end_time = datetime.combine(date, datetime.min.time()).replace(hour=end_hour, minute=end_min)
    
    while current_time < end_time:
        slot_end = current_time + timedelta(minutes=slot_duration)
        
        # Check current bookings for this slot
        booked_count = bookings_col.count_documents({
            'service_centre_id': str(service_centre_id),
            'status': {'$ne': 'CANCELLED'},
            'slot_start': current_time.isoformat(),
        })
        
        available_count = max_capacity - booked_count
        
        slots.append({
            'start': current_time.isoformat(),
            'end': slot_end.isoformat(),
            'available_slots': available_count,
            'is_available': available_count > 0,
            'booked_count': booked_count,
            'max_capacity': max_capacity
        })
        
        current_time = slot_end
    
    return slots


def get_available_service_centres_with_slots(date, user_location=None):
    '''Get all service centres with their available slots for a given date'''
    all_centres = list(service_centres_col.find({}))
    centres_with_slots = []
    
    for centre in all_centres:
        centre_id = centre['_id']
        slots = generate_available_slots(centre_id, date)
        
        # Only include centres that have at least one available slot
        available_slots = [s for s in slots if s['is_available']]
        
        centres_with_slots.append({
            'service_centre_id': str(centre_id),
            'name': centre.get('name'),
            'location': centre.get('location'),
            'contact': centre.get('contact'),
            'available_slots': available_slots,
            'total_available': len(available_slots),
            'working_hours': centre.get('working_hours'),
            'max_capacity': centre.get('max_capacity', 5)
        })
    
    return centres_with_slots


def create_booking(
    vehicle_id,
    user_id,
    service_centre_id,
    slot_start,
    slot_end,
    current_role
):
    require_roles(current_role, [UserRole.CUSTOMER, UserRole.OEM_ADMIN])

    # Convert to ObjectId if string
    if isinstance(service_centre_id, str):
        service_centre_id_obj = ObjectId(service_centre_id)
    else:
        service_centre_id_obj = service_centre_id
    
    # Validate that this slot exists and is available
    centre = service_centres_col.find_one({'_id': service_centre_id_obj})
    if not centre:
        raise ValueError('Service centre not found')
    
    max_capacity = centre.get('max_capacity', 5)
    
    # Check how many bookings already exist for this exact slot
    existing_count = bookings_col.count_documents({
        'service_centre_id': str(service_centre_id_obj),
        'status': {'$ne': 'CANCELLED'},
        'slot_start': slot_start,
    })
    
    if existing_count >= max_capacity:
        # Get alternative service centres for this date
        date = datetime.fromisoformat(slot_start.split('T')[0])
        alternatives = get_available_service_centres_with_slots(date)
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=409,
            detail={
                'error': 'Service centre is at full capacity for this time slot',
                'service_centre_id': str(service_centre_id_obj),
                'requested_slot': {'start': slot_start, 'end': slot_end},
                'available_alternatives': alternatives
            }
        )

    booking = {
        'vehicle_id': vehicle_id,
        'user_id': user_id,
        'service_centre_id': str(service_centre_id_obj),
        'slot_start': slot_start,
        'slot_end': slot_end,
        'status': 'CONFIRMED',
        'created_at': datetime.utcnow().isoformat(),
        'status_timeline': [
            {
                'status': 'CONFIRMED',
                'timestamp': datetime.utcnow().isoformat(),
                'notes': 'Booking confirmed'
            }
        ]
    }
    
    booking_id = str(bookings_col.insert_one(booking).inserted_id)
    
    # Notify service centre about new booking
    notify_service_centre(
        service_centre_id=str(service_centre_id_obj),
        message=f'New booking created for vehicle {vehicle_id}',
        booking_id=booking_id
    )
    
    return booking_id


def cancel_booking(booking_id, reason, current_role):
    require_roles(current_role, [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if isinstance(booking_id, str):
        booking_id = ObjectId(booking_id)
    
    booking = bookings_col.find_one({'_id': booking_id})
    if not booking:
        raise ValueError('Booking not found')
    
    # Update booking status
    bookings_col.update_one(
        {'_id': booking_id},
        {
            '$set': {
                'status': 'CANCELLED',
                'cancellation_reason': reason,
                'cancelled_at': datetime.utcnow().isoformat()
            },
            '$push': {
                'status_timeline': {
                    'status': 'CANCELLED',
                    'timestamp': datetime.utcnow().isoformat(),
                    'notes': reason or 'Booking cancelled'
                }
            }
        }
    )
    
    return True


def update_booking_status(booking_id, status, notes, current_role):
    '''Update booking status (e.g., CONFIRMED -> IN_PROGRESS -> COMPLETED)'''
    require_roles(current_role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if isinstance(booking_id, str):
        booking_id = ObjectId(booking_id)
    
    bookings_col.update_one(
        {'_id': booking_id},
        {
            '$set': {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            },
            '$push': {
                'status_timeline': {
                    'status': status,
                    'timestamp': datetime.utcnow().isoformat(),
                    'notes': notes
                }
            }
        }
    )
    
    return True


def get_service_centre_capacity(service_centre_id, slot_start, slot_end):
    '''Check capacity for a specific slot'''
    if isinstance(service_centre_id, str):
        service_centre_id = ObjectId(service_centre_id)
    
    centre = service_centres_col.find_one({'_id': service_centre_id})
    if not centre:
        return {'error': 'Service centre not found'}
    
    max_capacity = centre.get('max_capacity', 5)
    
    existing_count = bookings_col.count_documents({
        'service_centre_id': str(service_centre_id),
        'status': {'$ne': 'CANCELLED'},
        'slot_start': slot_start,
    })
    
    return {
        'service_centre_id': str(service_centre_id),
        'max_capacity': max_capacity,
        'booked': existing_count,
        'available': max_capacity - existing_count,
        'is_available': existing_count < max_capacity
    }
