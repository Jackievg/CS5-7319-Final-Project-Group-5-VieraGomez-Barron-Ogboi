from shared.models import db, Task, TaskShare
from event_broker.publisher import EventPublisher

def create_task(title, description, user_id, deadline=None, category='work'):
    task = Task(
        title=title,
        description=description,
        deadline=deadline,
        category=category,
        user_id=user_id
    )
    db.session.add(task)
    db.session.commit()
    EventPublisher().publish('TASK_CREATED', {'task_id': task.id})
    return task

def share_task(task_id, shared_with_ids):
    for user_id in shared_with_ids:
        share = TaskShare(task_id=task_id, shared_with_id=user_id)
        db.session.add(share)
    db.session.commit()
    EventPublisher().publish('TASK_SHARED', {'task_id': task_id, 'shared_with': shared_with_ids})