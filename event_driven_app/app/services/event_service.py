from shared.models import db, CompanyEvent
from event_broker.publisher import EventPublisher
from datetime import datetime

def create_company_event(title, start_date, end_date, description, creator_id):
    event = CompanyEvent(
        title=title,
        start_date=datetime.fromisoformat(start_date),
        end_date=datetime.fromisoformat(end_date),
        description=description,
        created_by=creator_id
    )
    db.session.add(event)
    db.session.commit()
    
    #  real-time calendar updates
    EventPublisher().publish(
        "COMPANY_EVENT_CREATED",
        {
            "event_id": event.id,
            "start_date": start_date,
            "end_date": end_date
        }
    )
    return event

def check_pto_conflicts(start_date, end_date):
    """Check for scheduling conflicts with existing PTO"""
    conflicts = db.session.query(PTORequest).filter(
        (PTORequest.start_date <= end_date) &
        (PTORequest.end_date >= start_date) &
        (PTORequest.status == 'approved')
    ).all()
    
    if conflicts:
        EventPublisher().publish(
            "SCHEDULING_CONFLICT",
            {"conflicting_users": [c.user_id for c in conflicts]}
        )
    return conflicts