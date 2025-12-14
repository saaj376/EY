from db import db
from datetime import datetime
from auth import require_roles
from utils import UserRole

invoices_col = db.invoices


def create_invoice(job_card_id, parts, labour_cost, tax, current_role):
    require_roles(current_role, [UserRole.SERVICE_CENTER])

    total = labour_cost + tax + sum(p["cost"] for p in parts)

    invoice = {
        "job_card_id": job_card_id,
        "parts": parts,
        "labour_cost": labour_cost,
        "tax": tax,
        "total_amount": total,
        "created_at": datetime.utcnow()
    }
    return invoices_col.insert_one(invoice).inserted_id
