from flask import Flask
from flask_cors import CORS
from shared.config import Config
from shared.models import db
from flask_jwt_extended import JWTManager

def create_app(config_class=Config):
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(config_class)
    
    db.init_app(app)
    jwt = JWTManager(app)
    
    from app.routes import task_routes, pto_routes, user_routes, event_routes
    app.register_blueprint(task_routes.bp)
    app.register_blueprint(pto_routes.bp)
    app.register_blueprint(user_routes.bp)
    app.register_blueprint(event_routes.bp)
    
    return app