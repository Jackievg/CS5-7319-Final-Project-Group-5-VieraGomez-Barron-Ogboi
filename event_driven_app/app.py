from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from shared.models import db
from datetime import timedelta

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-very-secure-secret-key-123')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-456')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Configure CORS properly
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:8080"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000"],
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

# Register blueprints
from routes.user_routes import bp as user_bp
from routes.task_routes import bp as task_bp
from routes.pto_routes import bp as pto_bp
from routes.event_routes import bp as event_bp

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(task_bp, url_prefix='/api')
app.register_blueprint(pto_bp, url_prefix='/api')
app.register_blueprint(event_bp, url_prefix='/api')

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "connected" if db.engine else "disconnected",
        "websocket": True
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": "Unauthorized"}), 401

# Register socket handlers
from events import register_socket_handlers
register_socket_handlers(socketio)

# Database setup
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    print("Starting server...")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)