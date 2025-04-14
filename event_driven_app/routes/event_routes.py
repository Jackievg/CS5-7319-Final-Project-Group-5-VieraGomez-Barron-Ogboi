from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..services.event_service import create_company_event, check_pto_conflicts

bp = Blueprint('events', __name__, url_prefix='/api/events')

@bp.route('/', methods=['POST'])
@jwt_required()
def handle_create_event():
    data = request.get_json()
    
    # Check for PTO conflicts first
    conflicts = check_pto_conflicts(
        data['start_date'],
        data['end_date']
    )
    
    if conflicts:
        return jsonify({
            "warning": "Scheduling conflicts detected",
            "conflicting_users": [c.user_id for c in conflicts]
        }), 200
    
    event = create_company_event(
        title=data['title'],
        start_date=data['start_date'],
        end_date=data['end_date'],
        description=data.get('description', ''),
        creator_id=get_jwt_identity()
    )
    return jsonify({"id": event.id}), 201

@bp.route('/conflicts', methods=['GET'])
@jwt_required()
def handle_check_conflicts():
    start = request.args.get('start')
    end = request.args.get('end')
    conflicts = check_pto_conflicts(start, end)
    return jsonify({
        "has_conflicts": bool(conflicts),
        "conflicts": [{
            "user_id": c.user_id,
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat()
        } for c in conflicts]
    })