from flask_socketio import emit, join_room, leave_room
from shared.models import db, User, Task, PTORequest, CompanyEvent
from datetime import datetime
import json
from functools import wraps
from flask import current_app

# --------------------------
# Utility Decorators
# --------------------------
def validate_user_room(f):
    @wraps(f)
    def wrapper(data):
        if not data.get('user_id'):
            current_app.logger.error("Missing user_id in event data")
            return
        return f(data)
    return wrapper

def validate_task_exists(f):
    @wraps(f)
    def wrapper(data):
        task = Task.query.get(data.get('task_id'))
        if not task:
            current_app.logger.error(f"Task not found: {data.get('task_id')}")
            return
        return f(data, task)
    return wrapper

def validate_pto_exists(f):
    @wraps(f)
    def wrapper(data):
        pto = PTORequest.query.get(data.get('pto_id'))
        if not pto:
            current_app.logger.error(f"PTO request not found: {data.get('pto_id')}")
            return
        return f(data, pto)
    return wrapper

# --------------------------
# Standardized Event Emitter
# --------------------------
def emit_event(event_type, payload, room=None, broadcast=False):
    """Standardized event emission format"""
    event = {
        'eventType': event_type,
        'timestamp': datetime.utcnow().isoformat(),
        'data': payload
    }
    
    if broadcast:
        emit(event_type, event, broadcast=True)
    elif room:
        emit(event_type, event, room=room)
    else:
        emit(event_type, event)

# --------------------------
# SocketIO Handlers
# --------------------------
def register_socket_handlers(socketio):
    @socketio.on('connect')
    def handle_connect():
        current_app.logger.info(f'Client connected: {request.sid}')

    @socketio.on('disconnect')
    def handle_disconnect():
        current_app.logger.info(f'Client disconnected: {request.sid}')

    @socketio.on('join')
    @validate_user_room
    def on_join(data):
        user_id = data['user_id']
        join_room(user_id)
        current_app.logger.info(f'User {user_id} joined room')
        emit_event('JOIN_SUCCESS', {'userId': user_id}, room=user_id)

    @socketio.on('leave')
    @validate_user_room
    def on_leave(data):
        user_id = data['user_id']
        leave_room(user_id)
        current_app.logger.info(f'User {user_id} left room')

    # --------------------------
    # Task Events
    # --------------------------
    @socketio.on('task_created')
    @validate_task_exists
    def handle_task_created(data, task):
        # Notify task owner
        emit_event('TASK_CREATED', task.to_dict(), room=str(task.user_id))
        
        # Notify shared users
        for user_id in [s.shared_with_id for s in task.shared_with]:
            emit_event('TASK_SHARED', {
                'task': task.to_dict(),
                'sharedBy': task.user_id
            }, room=str(user_id))

    @socketio.on('task_updated')
    @validate_task_exists
    def handle_task_updated(data, task):
        # Standard payload for all recipients
        payload = {
            'task': task.to_dict(),
            'updatedFields': data.get('updated_fields', [])
        }
        
        # Notify task owner
        emit_event('TASK_UPDATED', payload, room=str(task.user_id))
        
        # Notify shared users
        for user_id in [s.shared_with_id for s in task.shared_with]:
            emit_event('TASK_UPDATED', payload, room=str(user_id))

    @socketio.on('task_deleted')
    @validate_user_room
    @validate_task_exists
    def handle_task_deleted(data, task):
        emit_event('TASK_DELETED', {
            'taskId': data['task_id'],
            'deletedBy': data['user_id']
        }, room=str(task.user_id))

    # --------------------------
    # PTO Events
    # --------------------------
    @socketio.on('pto_requested')
    @validate_pto_exists
    def handle_pto_requested(data, pto):
        # Notify employee
        emit_event('PTO_REQUESTED', pto.to_dict(), room=str(pto.user_id))
        
        # Notify manager
        manager = User.query.filter_by(is_manager=True).first()
        if manager:
            emit_event('MANAGER_PTO_REQUESTED', {
                'request': pto.to_dict(),
                'employee': pto.requester.username
            }, room=str(manager.id))

    @socketio.on('pto_updated')
    @validate_pto_exists
    def handle_pto_updated(data, pto):
        payload = {
            'request': pto.to_dict(),
            'status': data.get('status'),
            'processedBy': data.get('processed_by')
        }
        
        # Notify employee
        emit_event('PTO_UPDATED', payload, room=str(pto.user_id))
        
        # Notify manager if status changed
        if data.get('status') in ['approved', 'rejected']:
            emit_event('PTO_RESOLVED', payload, room=str(pto.approver_id))

    # --------------------------
    # Company Events
    # --------------------------
    @socketio.on('company_event_created')
    def handle_company_event_created(data):
        # Validate required fields
        required = ['title', 'start_date', 'end_date']
        if not all(field in data for field in required):
            current_app.logger.error("Missing required fields for company event")
            return
            
        # Broadcast to all connected clients
        emit_event('COMPANY_EVENT_CREATED', data, broadcast=True)

    # --------------------------
    # Error Handling
    # --------------------------
    @socketio.on_error_default
    def default_error_handler(e):
        current_app.logger.error(f"SocketIO error: {str(e)}")
        emit_event('ERROR', {
            'message': 'An error occurred',
            'error': str(e)
        }, room=request.sid)