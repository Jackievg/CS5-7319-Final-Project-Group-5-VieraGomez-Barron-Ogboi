from flask_socketio import emit, join_room, leave_room
from shared.models import db, User, Task, PTORequest
from datetime import datetime
import json

def register_socket_handlers(socketio):
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('join')
    def on_join(data):
        user_id = data['user_id']
        join_room(user_id)
        print(f'User {user_id} joined their room')

    @socketio.on('leave')
    def on_leave(data):
        user_id = data['user_id']
        leave_room(user_id)
        print(f'User {user_id} left their room')

    @socketio.on('task_created')
    def handle_task_created(data):
        task = Task.query.get(data['task_id'])
        if task:
            emit('task_created', {
                'eventType': 'TASK_CREATED',
                'task': task.to_dict()
            }, room=str(task.user_id))
            
            for user_id in task.shared_with:
                emit('task_shared', {
                    'eventType': 'TASK_SHARED',
                    'task': task.to_dict()
                }, room=str(user_id))

    @socketio.on('task_updated')
    def handle_task_updated(data):
        task = Task.query.get(data['task_id'])
        if task:
            emit('task_updated', {
                'eventType': 'TASK_UPDATED',
                'task': task.to_dict()
            }, room=str(task.user_id))
            
            for user_id in task.shared_with:
                emit('task_updated', {
                    'eventType': 'TASK_UPDATED',
                    'task': task.to_dict()
                }, room=str(user_id))

    @socketio.on('task_deleted')
    def handle_task_deleted(data):
        emit('task_deleted', {
            'eventType': 'TASK_DELETED',
            'taskId': data['task_id']
        }, room=str(data['user_id']))

    @socketio.on('pto_requested')
    def handle_pto_requested(data):
        pto = PTORequest.query.get(data['pto_id'])
        if pto:
            emit('pto_requested', {
                'eventType': 'PTO_REQUESTED',
                'pto': pto.to_dict()
            }, room=str(pto.user_id))
            
            manager = User.query.filter_by(is_manager=True).first()
            if manager:
                emit('pto_requested', {
                    'eventType': 'PTO_REQUESTED',
                    'pto': pto.to_dict()
                }, room=str(manager.id))

    @socketio.on('pto_updated')
    def handle_pto_updated(data):
        pto = PTORequest.query.get(data['pto_id'])
        if pto:
            emit('pto_updated', {
                'eventType': 'PTO_UPDATED',
                'pto': pto.to_dict()
            }, room=str(pto.user_id))

    @socketio.on('company_event_created')
    def handle_company_event_created(data):
        emit('company_event_created', {
            'eventType': 'COMPANY_EVENT_CREATED',
            'event': data
        }, broadcast=True)
