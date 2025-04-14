# event_driven_app/app.py
from flask import Flask, jsonify  # Added jsonify
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from shared.models import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

CORS(app, resources={r"/*": {"origins": "*"}})
db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Import and register blueprints
from routes.user_routes import bp as user_bp
from routes.task_routes import bp as task_bp
from routes.pto_routes import bp as pto_bp
from routes.event_routes import bp as event_bp

app.register_blueprint(user_bp)
app.register_blueprint(task_bp)
app.register_blueprint(pto_bp)
app.register_blueprint(event_bp)

# Add health check route BEFORE registering socket handlers
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "connected" if db.engine else "disconnected",
        "websocket": True
    })

from events import register_socket_handlers
register_socket_handlers(socketio)

if __name__ == '__main__':
    print("Starting server...")  # Debug output
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    socketio.run(app, debug=True, port=8080)