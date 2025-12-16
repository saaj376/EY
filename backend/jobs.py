# Backend: Enhanced Job Cards with Worker Logs
# File: backend/jobs.py

from db import db
from datetime import datetime
from auth import require_roles
from utils import UserRole
from bson import ObjectId

jobs_col = db.job_cards
worker_logs_col = db.worker_logs


def create_job_card(booking_id, notes, current_role, assigned_technician=None):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    if isinstance(booking_id, str):
        booking_id_obj = ObjectId(booking_id)
    else:
        booking_id_obj = booking_id
    
    # Get booking details
    booking = db.bookings.find_one({'_id': booking_id_obj})
    if not booking:
        raise ValueError('Booking not found')

    job = {
        'booking_id': str(booking_id_obj),
        'vehicle_id': booking.get('vehicle_id'),
        'service_centre_id': booking.get('service_centre_id'),
        'technician_notes': notes or 'Job card created',
        'assigned_technician': assigned_technician,
        'status': 'OPEN',
        'parts_used': [],
        'labour_hours': 0,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'work_timeline': [
            {
                'status': 'OPEN',
                'timestamp': datetime.utcnow().isoformat(),
                'technician': assigned_technician,
                'notes': notes or 'Job card created'
            }
        ]
    }
    
    job_id = str(jobs_col.insert_one(job).inserted_id)
    
    # Create initial worker log
    create_worker_log(
        job_card_id=job_id,
        worker_name=assigned_technician or 'System',
        action='JOB_CREATED',
        notes=notes or 'Job card created',
        current_role=current_role
    )
    
    # Update booking status to IN_PROGRESS
    db.bookings.update_one(
        {'_id': booking_id_obj},
        {
            '$set': {'status': 'IN_PROGRESS'},
            '$push': {
                'status_timeline': {
                    'status': 'IN_PROGRESS',
                    'timestamp': datetime.utcnow().isoformat(),
                    'notes': 'Job card created, work started'
                }
            }
        }
    )
    
    return job_id


def update_job_status(job_id, status, notes, current_role, technician=None):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    if isinstance(job_id, str):
        job_id_obj = ObjectId(job_id)
    else:
        job_id_obj = job_id

    jobs_col.update_one(
        {'_id': job_id_obj},
        {
            '$set': {
                'status': status,
                'technician_notes': notes,
                'updated_at': datetime.utcnow().isoformat()
            },
            '$push': {
                'work_timeline': {
                    'status': status,
                    'timestamp': datetime.utcnow().isoformat(),
                    'technician': technician,
                    'notes': notes
                }
            }
        }
    )
    
    # Create worker log
    create_worker_log(
        job_card_id=str(job_id_obj),
        worker_name=technician or 'Technician',
        action=f'STATUS_CHANGE_{status}',
        notes=notes,
        current_role=current_role
    )
    
    # If job is completed, update booking
    if status == 'COMPLETED':
        job = jobs_col.find_one({'_id': job_id_obj})
        if job and job.get('booking_id'):
            db.bookings.update_one(
                {'_id': ObjectId(job['booking_id'])},
                {
                    '$set': {'status': 'WORK_COMPLETED'},
                    '$push': {
                        'status_timeline': {
                            'status': 'WORK_COMPLETED',
                            'timestamp': datetime.utcnow().isoformat(),
                            'notes': 'Service work completed'
                        }
                    }
                }
            )
    
    return True


def add_parts_to_job(job_id, parts, current_role, added_by=None):
    '''Add parts used in the job'''
    require_roles(current_role, [UserRole.SERVICE_CENTER])
    
    if isinstance(job_id, str):
        job_id_obj = ObjectId(job_id)
    else:
        job_id_obj = job_id
    
    # Parts should be a list of dictionaries with name, quantity, cost
    jobs_col.update_one(
        {'_id': job_id_obj},
        {
            '$push': {
                'parts_used': {
                    '$each': parts
                }
            },
            '$set': {
                'updated_at': datetime.utcnow().isoformat()
            }
        }
    )
    
    # Log parts addition
    parts_summary = ', '.join([f"{p['name']} (x{p.get('quantity', 1)})" for p in parts])
    create_worker_log(
        job_card_id=str(job_id_obj),
        worker_name=added_by or 'Technician',
        action='PARTS_ADDED',
        notes=f'Parts added: {parts_summary}',
        current_role=current_role,
        metadata={'parts': parts}
    )
    
    return True


def update_labour_hours(job_id, hours, current_role, technician=None):
    '''Update labour hours for the job'''
    require_roles(current_role, [UserRole.SERVICE_CENTER])
    
    if isinstance(job_id, str):
        job_id_obj = ObjectId(job_id)
    else:
        job_id_obj = job_id
    
    jobs_col.update_one(
        {'_id': job_id_obj},
        {
            '$set': {
                'labour_hours': hours,
                'updated_at': datetime.utcnow().isoformat()
            }
        }
    )
    
    create_worker_log(
        job_card_id=str(job_id_obj),
        worker_name=technician or 'Technician',
        action='LABOUR_HOURS_UPDATE',
        notes=f'Labour hours updated to {hours} hours',
        current_role=current_role,
        metadata={'hours': hours}
    )
    
    return True


def create_worker_log(job_card_id, worker_name, action, notes, current_role, metadata=None):
    '''Create a worker activity log entry'''
    require_roles(current_role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    log_entry = {
        'job_card_id': job_card_id,
        'worker_name': worker_name,
        'action': action,
        'notes': notes,
        'timestamp': datetime.utcnow().isoformat(),
        'metadata': metadata or {}
    }
    
    # Get job card details for context
    if isinstance(job_card_id, str):
        job = jobs_col.find_one({'_id': ObjectId(job_card_id)})
    else:
        job = jobs_col.find_one({'_id': job_card_id})
    
    if job:
        log_entry['service_centre_id'] = job.get('service_centre_id')
        log_entry['vehicle_id'] = job.get('vehicle_id')
    
    return str(worker_logs_col.insert_one(log_entry).inserted_id)


def get_worker_logs(job_card_id=None, service_centre_id=None, start_date=None, end_date=None):
    '''Get worker logs with optional filters'''
    query = {}
    
    if job_card_id:
        query['job_card_id'] = job_card_id
    
    if service_centre_id:
        query['service_centre_id'] = service_centre_id
    
    if start_date:
        query['timestamp'] = {'$gte': start_date}
    
    if end_date:
        if 'timestamp' in query:
            query['timestamp']['$lte'] = end_date
        else:
            query['timestamp'] = {'$lte': end_date}
    
    logs = list(worker_logs_col.find(query).sort('timestamp', -1))
    for log in logs:
        log['_id'] = str(log['_id'])
    
    return logs


def get_job_card_details(job_id):
    '''Get complete job card details with worker logs'''
    if isinstance(job_id, str):
        job_id_obj = ObjectId(job_id)
    else:
        job_id_obj = job_id
    
    job = jobs_col.find_one({'_id': job_id_obj})
    if not job:
        return None
    
    job['_id'] = str(job['_id'])
    job['worker_logs'] = get_worker_logs(job_card_id=job['_id'])
    
    return job
