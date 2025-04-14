from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..services.user_service import register_user, authenticate_user

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/register', methods=['POST'])
def handle_register():
    data = request.get_json()
    user = register_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        is_manager=data.get('is_manager', False)
    )
    
    if not user:
        return jsonify({"error": "User already exists"}), 409
        
    access_token = create_access_token(identity=user.id)
    return jsonify({
        "access_token": access_token,
        "is_manager": user.is_manager
    }), 201

@bp.route('/login', methods=['POST'])
def handle_login():
    data = request.get_json()
    user = authenticate_user(data['username'], data['password'])
    
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
        
    access_token = create_access_token(identity=user.id)
    return jsonify({
        "access_token": access_token,
        "is_manager": user.is_manager
    })