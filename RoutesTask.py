from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import Task, TaskShare, User, CompanyEvent
from extensions import db
from flask import current_app

tasks_bp = Blueprint('tasks', __name__, url_prefix='/tasks')

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    current_user_id =int(get_jwt_identity())
    
    # Get user's own tasks
    own_tasks = Task.query.filter_by(user_id=current_user_id).all()
    
    # Get tasks shared with the user
    shared_tasks_ids = [ts.task_id for ts in TaskShare.query.filter_by(shared_with_id=current_user_id).all()]
    shared_tasks = Task.query.filter(Task.id.in_(shared_tasks_ids)).all()
    
    # Combine and format the results
    result = []
    
    for task in own_tasks:
        result.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'deadline': task.deadline.isoformat() if task.deadline else None,
            'category': task.category,
            'completed': task.completed,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat(),
            'is_owner': True
        })
    
    for task in shared_tasks:
        result.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'deadline': task.deadline.isoformat() if task.deadline else None,
            'category': task.category,
            'completed': task.completed,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat(),
            'owner': User.query.get(task.user_id).username,
            'is_owner': False
        })
    
    return jsonify(result), 200

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    current_user_id = int(get_jwt_identity()) 
    data = request.get_json()
    
    try:
        new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        deadline=datetime.strptime(data['deadline'], '%Y-%m-%d') if 'deadline' in data else None,
        category=data.get('category', 'work'),
        user_id=current_user_id
        )

        db.session.add(new_task)
        db.session.commit()
    
    # Handle task sharing if specified
        if 'shared_with' in data and data['shared_with']:
            for username in data['shared_with']:
                user = User.query.filter_by(username=username).first()
                if user:
                    task_share = TaskShare(
                    task_id=new_task.id,
                    shared_with_id=user.id
                )
                db.session.add(task_share)
        
            db.session.commit()
    
        return jsonify({
        'message': 'Task created successfully',
        'id': new_task.id
        }), 201
    except Exception as e:
        current_app.logger.error(f"Error in create_task: {e}")
        return jsonify({'message': 'Task creation failed', 'error': str(e)}), 422



@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    # Check if the user is the owner or the task is shared with them
    is_owner = task.user_id == current_user_id
    is_shared = TaskShare.query.filter_by(task_id=task_id, shared_with_id=current_user_id).first() is not None
    
    if not (is_owner or is_shared):
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Get users the task is shared with
    shared_with = []
    for share in TaskShare.query.filter_by(task_id=task_id).all():
        user = User.query.get(share.shared_with_id)
        shared_with.append(user.username)
    
    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'category': task.category,
        'completed': task.completed,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'owner': User.query.get(task.user_id).username,
        'is_owner': is_owner,
        'shared_with': shared_with
    }), 200

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    # Only the owner can update the task
    if task.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'deadline' in data:
        task.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
    if 'category' in data:
        task.category = data['category']
    if 'completed' in data:
        task.completed = data['completed']
    
    # Update task sharing
    if 'shared_with' in data:
        # Remove existing shares
        TaskShare.query.filter_by(task_id=task_id).delete()
        
        # Add new shares
        for username in data['shared_with']:
            user = User.query.filter_by(username=username).first()
            if user:
                task_share = TaskShare(
                    task_id=task_id,
                    shared_with_id=user.id
                )
                db.session.add(task_share)
    
    db.session.commit()
    
    return jsonify({'message': 'Task updated successfully'}), 200

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    # Only the owner can delete the task
    if task.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Delete all shares of this task
    TaskShare.query.filter_by(task_id=task_id).delete()
    
    # Delete the task
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'}), 200

@tasks_bp.route('/events', methods=['GET'])
@jwt_required()
def get_company_events():
    events = CompanyEvent.query.all()
    
    result = []
    for event in events:
        result.append({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'start_date': event.start_date.isoformat(),
            'end_date': event.end_date.isoformat(),
            'created_by': User.query.get(event.created_by).username
        })
    
    return jsonify(result), 200

@tasks_bp.route('/events', methods=['POST'])
@jwt_required()
def create_company_event():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    # Only managers can create company events
    if not user.is_manager:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    new_event = CompanyEvent(
        title=data['title'],
        description=data.get('description', ''),
        start_date=datetime.fromisoformat(data['start_date']),
        end_date=datetime.fromisoformat(data['end_date']),
        created_by=current_user_id
    )
    
    db.session.add(new_event)
    db.session.commit()
    
    return jsonify({
        'message': 'Company event created successfully',
        'id': new_event.id
    }), 201