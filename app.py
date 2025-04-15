from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from extensions import db, jwt
import config

def create_app(config_object=config.DevelopmentConfig):
    app = Flask(__name__)

    # Enhanced CORS configuration
    CORS(
        app,
        origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5000"],
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Authorization"],
        max_age=600
    )

    app.config.from_object(config_object)

    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from RoutesTask import tasks_bp
    from RoutesUsers import users_bp

    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)

    # Add explicit OPTIONS handler for /tasks (optional)
    @app.route('/tasks', methods=['OPTIONS'])
    def tasks_options():
        return jsonify({}), 200

    @app.route('/')
    def index():
        return render_template('index.html')

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)


