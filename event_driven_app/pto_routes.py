from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.services.pto_service import request_pto, approve_pto

bp = Blueprint('pto', __name__, url_prefix='/api/pto')

@bp.route('/', methods=['POST'])
@jwt_required()
def request_pto_route():
    data = request.get_json()
    pto = request_pto(
        user_id=get_jwt_identity(),
        start_date=datetime.fromisoformat(data['start_date']),
        end_date=datetime.fromisoformat(data['end_date']),
        reason=data.get('reason')
    )
    return jsonify({'id': pto.id}), 201

@bp.route('/<int:pto_id>/approve', methods=['POST'])
@jwt_required()
def approve_pto_route(pto_id):
    approve_pto(pto_id, get_jwt_identity())
    return jsonify({'message': 'PTO approved'}), 200