# Backend: Enhanced Service Centre Portal Views
# File: backend/service_views.py

from fastapi import APIRouter, Depends, HTTPException, Query
from auth import get_current_role, require_roles
from utils import UserRole
from db import db
from bson import ObjectId
import jobs
import invoices
from datetime import datetime, timedelta

router = APIRouter(prefix='/service', tags=['Service Centre Views'])


@router.get('/bookings')
def get_my_bookings(
    service_centre_id: str,
    status: str = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if db is None:
        return []

    print(f"[DEBUG] get_my_bookings called with service_centre_id='{service_centre_id}', status='{status}'")
    query = {'service_centre_id': service_centre_id}
    if status:
        query['status'] = status
    
    bookings = list(db.bookings.find(query).sort('slot_start', 1))
    
    # Convert MongoDB _id to booking_id and enrich with customer info
    for booking in bookings:
        if '_id' in booking:
            booking['booking_id'] = str(booking['_id'])
            del booking['_id']
        
        # Get customer details
        if booking.get('user_id'):
            customer = db.users.find_one({'user_id': booking['user_id']})
            if customer:
                booking['customer_name'] = customer.get('name', 'N/A')
                booking['customer_phone'] = customer.get('phone', 'N/A')
                booking['customer_email'] = customer.get('email', 'N/A')
        
        # Get vehicle details
        if booking.get('vehicle_id'):
            vehicle = db.vehicles.find_one({'vin': booking['vehicle_id']})
            if vehicle:
                booking['vehicle_make'] = vehicle.get('make', 'N/A')
                booking['vehicle_model'] = vehicle.get('model', 'N/A')
                booking['vehicle_year'] = vehicle.get('year', 'N/A')
    
    return bookings


@router.get('/jobs')
def get_my_jobs(
    service_centre_id: str,
    status: str = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if db is None:
        return []

    query = {'service_centre_id': service_centre_id}
    if status:
        query['status'] = status
    
    job_cards = list(db.job_cards.find(query).sort('created_at', -1))
    
    # Convert MongoDB _id to job_card_id
    for job in job_cards:
        if '_id' in job:
            job['job_card_id'] = str(job['_id'])
            del job['_id']
        
        # Get worker logs for this job
        if job.get('job_card_id'):
            job['worker_logs'] = jobs.get_worker_logs(job_card_id=job['job_card_id'])
    
    return job_cards


@router.get('/job/{job_id}/details')
def get_job_details(
    job_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    job_details = jobs.get_job_card_details(job_id)
    if not job_details:
        raise HTTPException(status_code=404, detail='Job card not found')
    
    return job_details


@router.post('/job/create')
def create_job(
    payload: dict,
    role=Depends(get_current_role)
):
    try:
        job_id = jobs.create_job_card(
            booking_id=payload['booking_id'],
            notes=payload.get('notes', ''),
            current_role=role,
            assigned_technician=payload.get('assigned_technician')
        )
        return {'job_card_id': job_id, 'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/job/{job_id}/status')
def update_job(
    job_id: str,
    payload: dict,
    role=Depends(get_current_role)
):
    try:
        jobs.update_job_status(
            job_id=job_id,
            status=payload['status'],
            notes=payload.get('notes', ''),
            current_role=role,
            technician=payload.get('technician')
        )
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/job/{job_id}/parts')
def add_parts(
    job_id: str,
    payload: dict,
    role=Depends(get_current_role)
):
    try:
        jobs.add_parts_to_job(
            job_id=job_id,
            parts=payload['parts'],
            current_role=role,
            added_by=payload.get('added_by')
        )
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/job/{job_id}/labour')
def update_labour(
    job_id: str,
    payload: dict,
    role=Depends(get_current_role)
):
    try:
        jobs.update_labour_hours(
            job_id=job_id,
            hours=payload['hours'],
            current_role=role,
            technician=payload.get('technician')
        )
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/worker-logs')
def get_logs(
    service_centre_id: str,
    job_card_id: str = None,
    start_date: str = None,
    end_date: str = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    return jobs.get_worker_logs(
        job_card_id=job_card_id,
        service_centre_id=service_centre_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get('/invoices')
def get_invoices(
    service_centre_id: str,
    status: str = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    return invoices.get_invoices_by_service_centre(service_centre_id, status)


@router.get('/invoice/{invoice_id}')
def get_invoice(
    invoice_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.CUSTOMER, UserRole.OEM_ADMIN])
    
    invoice = invoices.get_invoice_details(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail='Invoice not found')
    
    return invoice


@router.post('/invoice/create')
def create_invoice(
    payload: dict,
    role=Depends(get_current_role)
):
    try:
        invoice_id = invoices.create_invoice(
            job_card_id=payload['job_card_id'],
            parts=payload.get('parts', []),
            labour_cost=payload.get('labour_cost', 0),
            tax=payload.get('tax', 18),
            current_role=role,
            labour_rate_per_hour=payload.get('labour_rate_per_hour', 100)
        )
        return {'invoice_id': invoice_id, 'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/invoice/{invoice_id}/payment')
def update_payment(
    invoice_id: str,
    payload: dict,
    role=Depends(get_current_role)
):
    try:
        invoices.update_payment_status(
            invoice_id=invoice_id,
            payment_status=payload['payment_status'],
            payment_method=payload.get('payment_method'),
            transaction_id=payload.get('transaction_id'),
            current_role=role
        )
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/alerts')
def get_related_alerts(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if db is None:
        return []

    # Get all bookings for this service centre
    bookings = db.bookings.find({'service_centre_id': service_centre_id})
    vehicle_ids = list(set([b['vehicle_id'] for b in bookings if b.get('vehicle_id')]))

    # Get alerts for these vehicles
    alerts = list(db.alerts.find(
        {'vehicle_id': {'$in': vehicle_ids}},
        {'_id': 0}
    ).sort('timestamp', -1).limit(100))
    
    return alerts


@router.get('/capa')
def get_assigned_capa(
    service_centre_id: str = None,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if db is None:
        return []

    query = {'owner_team': 'Service'}
    capa_actions = list(db.capa_actions.find(query, {'_id': 0}).sort('created_at', -1))
    
    return capa_actions


@router.get('/booking/timeline')
def get_booking_timeline(
    booking_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    if db is None:
        return {'status_timeline': []}

    if isinstance(booking_id, str):
        booking_id_obj = ObjectId(booking_id)
    else:
        booking_id_obj = booking_id
    
    booking = db.bookings.find_one(
        {'_id': booking_id_obj},
        {'status_timeline': 1, '_id': 0}
    )
    return booking or {'status_timeline': []}


@router.get('/dashboard/stats')
def get_dashboard_stats(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    
    # Get total active bookings (CONFIRMED or PENDING or IN_PROGRESS)
    # Changed from "Today's" to "All Active" for better visibility in demo
    active_bookings_count = db.bookings.count_documents({
        'service_centre_id': service_centre_id,
        'status': {'$in': ['PENDING', 'CONFIRMED', 'IN_PROGRESS']}
    })
    
    # Get active jobs
    active_jobs = db.job_cards.count_documents({
        'service_centre_id': service_centre_id,
        'status': {'$in': ['OPEN', 'IN_PROGRESS']}
    })
    
    # Get pending invoices
    pending_invoices = db.invoices.count_documents({
        'service_centre_id': service_centre_id,
        'payment_status': 'UNPAID'
    })
    
    # Get total revenue (Lifetime) -> more impressive than this month for demo
    revenue_pipeline = [
        {
            '$match': {
                'service_centre_id': service_centre_id,
                'payment_status': 'PAID'
            }
        },
        {
            '$group': {
                '_id': None,
                'total': {'$sum': '$total_amount'}
            }
        }
    ]
    
    revenue_result = list(db.invoices.aggregate(revenue_pipeline))
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    return {
        'todays_bookings': active_bookings_count, # Reusing key but sending total active
        'active_jobs': active_jobs,
        'pending_invoices': pending_invoices,
        'monthly_revenue': total_revenue, # Reusing key but sending total
        'service_centre_id': service_centre_id
    }


@router.get('/notifications')
def get_notifications(
    service_centre_id: str,
    role=Depends(get_current_role)
):
    require_roles(role, [UserRole.SERVICE_CENTER])
    
    if db is None:
        return []
    
    # Get recent notifications
    notifications = list(db.notifications.find({
        'recipient_type': 'SERVICE_CENTER',
        'recipient_id': service_centre_id
    }).sort('created_at', -1).limit(50))
    
    for notif in notifications:
        notif['notification_id'] = str(notif['_id'])
        del notif['_id']
    
    return notifications

@router.get('/centres/slots')
def get_service_centre_slots(
    service_centre_id: str,
    date: str,
    role=Depends(get_current_role)
):
    # Allow customers, service centres, and admins to query slots
    require_roles(role, [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN])
    try:
        from service import generate_available_slots
        return generate_available_slots(service_centre_id, date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
