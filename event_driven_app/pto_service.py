from shared.models import db, PTORequest
from event_broker.publisher import EventPublisher

def request_pto(user_id, start_date, end_date, reason):
    pto = PTORequest(
        start_date=start_date,
        end_date=end_date,
        reason=reason,
        user_id=user_id
    )
    db.session.add(pto)
    db.session.commit()
    EventPublisher().publish('PTO_REQUESTED', {'pto_id': pto.id})
    return pto

def approve_pto(pto_id, manager_id):
    pto = PTORequest.query.get(pto_id)
    pto.status = 'approved'
    pto.approver_id = manager_id
    db.session.commit()
    EventPublisher().publish('PTO_APPROVED', {'pto_id': pto.id})