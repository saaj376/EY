# Backend: Enhanced Invoices with Customer Details
# File: backend/invoices.py

from db import db
from datetime import datetime
from auth import require_roles
from utils import UserRole
from bson import ObjectId

invoices_col = db.invoices


def create_invoice(job_card_id, parts, labour_cost, tax, current_role, labour_rate_per_hour=100):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    if isinstance(job_card_id, str):
        job_card_id_obj = ObjectId(job_card_id)
    else:
        job_card_id_obj = job_card_id
    
    # Get job card details
    job = db.job_cards.find_one({'_id': job_card_id_obj})
    if not job:
        raise ValueError('Job card not found')
    
    # Get booking details
    booking_id = job.get('booking_id')
    if isinstance(booking_id, str):
        booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
    else:
        booking = db.bookings.find_one({'_id': booking_id})
    
    if not booking:
        raise ValueError('Booking not found')
    
    # Get customer details
    user_id = booking.get('user_id')
    customer = db.users.find_one({'user_id': user_id})
    
    # Calculate labour cost based on hours if not provided
    if labour_cost == 0 or labour_cost is None:
        labour_hours = job.get('labour_hours', 0)
        labour_cost = labour_hours * labour_rate_per_hour
    
    # Calculate parts total
    parts_total = sum(p.get('cost', 0) * p.get('quantity', 1) for p in parts)
    
    # Calculate subtotal, tax, and total
    subtotal = parts_total + labour_cost
    tax_amount = subtotal * (tax / 100) if tax else subtotal * 0.18  # Default 18% tax
    total = subtotal + tax_amount

    invoice = {
        'job_card_id': str(job_card_id_obj),
        'booking_id': str(booking_id) if isinstance(booking_id, ObjectId) else booking_id,
        'vehicle_id': job.get('vehicle_id'),
        'service_centre_id': job.get('service_centre_id'),
        'customer_id': user_id,
        'customer_name': customer.get('name', 'N/A') if customer else 'N/A',
        'customer_email': customer.get('email', 'N/A') if customer else 'N/A',
        'customer_phone': customer.get('phone', 'N/A') if customer else 'N/A',
        'parts': parts,
        'parts_total': parts_total,
        'labour_hours': job.get('labour_hours', 0),
        'labour_rate_per_hour': labour_rate_per_hour,
        'labour_cost': labour_cost,
        'subtotal': subtotal,
        'tax_percentage': tax if tax else 18,
        'tax_amount': tax_amount,
        'total_amount': total,
        'status': 'PENDING',
        'payment_status': 'UNPAID',
        'created_at': datetime.utcnow().isoformat(),
        'due_date': (datetime.utcnow() + timedelta(days=15)).isoformat() if 'timedelta' in dir() else None,
        'invoice_number': generate_invoice_number()
    }
    
    invoice_id = str(invoices_col.insert_one(invoice).inserted_id)
    
    # Update job card status
    db.job_cards.update_one(
        {'_id': job_card_id_obj},
        {
            '$set': {
                'status': 'INVOICED',
                'invoice_id': invoice_id,
                'updated_at': datetime.utcnow().isoformat()
            }
        }
    )
    
    # Update booking status
    if isinstance(booking_id, str):
        booking_id_obj = ObjectId(booking_id)
    else:
        booking_id_obj = booking_id
        
    db.bookings.update_one(
        {'_id': booking_id_obj},
        {
            '$set': {'status': 'AWAITING_PAYMENT'},
            '$push': {
                'status_timeline': {
                    'status': 'AWAITING_PAYMENT',
                    'timestamp': datetime.utcnow().isoformat(),
                    'notes': f'Invoice generated: {invoice["invoice_number"]}'
                }
            }
        }
    )
    
    return invoice_id


def generate_invoice_number():
    '''Generate a unique invoice number'''
    from datetime import datetime
    timestamp = datetime.utcnow()
    count = invoices_col.count_documents({})
    return f'INV-{timestamp.strftime("%Y%m")}-{count + 1:05d}'


def update_payment_status(invoice_id, payment_status, payment_method=None, transaction_id=None, current_role=None):
    '''Update payment status of an invoice'''
    if isinstance(invoice_id, str):
        invoice_id_obj = ObjectId(invoice_id)
    else:
        invoice_id_obj = invoice_id
    
    update_data = {
        'payment_status': payment_status,
        'updated_at': datetime.utcnow().isoformat()
    }
    
    if payment_status == 'PAID':
        update_data['paid_at'] = datetime.utcnow().isoformat()
        update_data['payment_method'] = payment_method
        update_data['transaction_id'] = transaction_id
    
    invoices_col.update_one(
        {'_id': invoice_id_obj},
        {'$set': update_data}
    )
    
    # If paid, update booking to COMPLETED
    if payment_status == 'PAID':
        invoice = invoices_col.find_one({'_id': invoice_id_obj})
        if invoice and invoice.get('booking_id'):
            booking_id = invoice['booking_id']
            if isinstance(booking_id, str):
                booking_id_obj = ObjectId(booking_id)
            else:
                booking_id_obj = booking_id
                
            db.bookings.update_one(
                {'_id': booking_id_obj},
                {
                    '$set': {'status': 'COMPLETED'},
                    '$push': {
                        'status_timeline': {
                            'status': 'COMPLETED',
                            'timestamp': datetime.utcnow().isoformat(),
                            'notes': 'Payment received and booking completed'
                        }
                    }
                }
            )
    
    return True


def get_invoice_details(invoice_id):
    '''Get complete invoice details'''
    if isinstance(invoice_id, str):
        invoice_id_obj = ObjectId(invoice_id)
    else:
        invoice_id_obj = invoice_id
    
    invoice = invoices_col.find_one({'_id': invoice_id_obj})
    if not invoice:
        return None
    
    invoice['invoice_id'] = str(invoice['_id'])
    del invoice['_id']
    
    # Get related job card and booking info
    if invoice.get('job_card_id'):
        job = db.job_cards.find_one({'_id': ObjectId(invoice['job_card_id'])})
        if job:
            invoice['job_details'] = {
                'technician': job.get('assigned_technician'),
                'work_timeline': job.get('work_timeline', [])
            }
    
    return invoice


def get_invoices_by_service_centre(service_centre_id, status=None):
    '''Get all invoices for a service centre'''
    query = {'service_centre_id': service_centre_id}
    if status:
        query['payment_status'] = status
    
    invoices = list(invoices_col.find(query).sort('created_at', -1))
    for invoice in invoices:
        invoice['invoice_id'] = str(invoice['_id'])
        del invoice['_id']
    
    return invoices


def get_invoices_by_customer(customer_id):
    '''Get all invoices for a customer'''
    invoices = list(invoices_col.find({'customer_id': customer_id}).sort('created_at', -1))
    for invoice in invoices:
        invoice['invoice_id'] = str(invoice['_id'])
        del invoice['_id']
    
    return invoices


# Import timedelta for due date calculation
from datetime import timedelta
