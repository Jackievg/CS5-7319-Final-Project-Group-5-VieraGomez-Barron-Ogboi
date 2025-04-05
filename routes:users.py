from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User, PTORequest
from app import db

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        is_manager=data.get('is_manager', False)
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    # Create access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'user_id': user.id,
        'username': user.username,
        'is_manager': user.is_manager
    }), 200

@users_bp.route('/pto', methods=['POST'])
@jwt_required()
def request_pto():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    new_pto = PTORequest(
        start_date=data['start_date'],
        end_date=data['end_date'],
        reason=data.get('reason', ''),
        user_id=current_user_id
    )
    
    db.session.add(new_pto)
    db.session.commit()
    
    return jsonify({'message': 'PTO request submitted successfully', 'id': new_pto.id}), 201

@users_bp.route('/pto', methods=['GET'])
@jwt_required()
def get_pto_requests():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.is_manager:
        # Managers can see all PTO requests
        pto_requests = PTORequest.query.all()
    else:
        # Regular users can only see their own requests
        pto_requests = PTORequest.query.filter_by(user_id=current_user_id).all()
    
    result = []
    for pto in pto_requests:
        result.append({
            'id': pto.id,
            'start_date': pto.start_date.isoformat(),
            'end_date': pto.end_date.isoformat(),
            'reason': pto.reason,
            'status': pto.status,
            'requester': User.query.get(pto.user_id).username
        })
    
    return jsonify(result), 200

@users_bp.route('/pto/<int:pto_id>', methods=['PUT'])
@jwt_required()
def update_pto_status(pto_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only managers can approve/reject PTO requests
    if not user.is_manager:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    pto_request = PTORequest.query.get(pto_id)
    
    if not pto_request:
        return jsonify({'message': 'PTO request not found'}), 404
    
    pto_request.status = data['status']
    pto_request.approver_id = current_user_id
    
    db.session.commit()
    
    return jsonify({'message': f'PTO request {data["status"]}'}), 200