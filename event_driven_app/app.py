# event_driven_app/app.py
from flask import Flask
from shared.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    from shared.models import db
    db.init_app(app)
    
    # Register blueprints
    from routes import task_routes, user_routes  # etc.
    app.register_blueprint(task_routes.bp)
    app.register_blueprint(user_routes.bp)
    
    return app