from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from shared.models import db, Task, TaskShare
from app.services.task_service import create_task, share_task

bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

@bp.route('/', methods=['POST'])
@jwt_required()
def create_task_route():
    data = request.get_json()
    task = create_task(
        title=data['title'],
        description=data.get('description'),
        user_id=get_jwt_identity(),
        deadline=data.get('deadline'),
        category=data.get('category', 'work')
    )
    return jsonify({'id': task.id}), 201

@bp.route('/<int:task_id>/share', methods=['POST'])
@jwt_required()
def share_task_route(task_id):
    data = request.get_json()
    share_task(task_id, data['user_ids'])
    return jsonify({'message': 'Task shared successfully'}), 200