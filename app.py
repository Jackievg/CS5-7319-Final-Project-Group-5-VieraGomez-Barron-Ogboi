from flask import Flask, render_template
from flask_cors import CORS
from extensions import db, jwt
import config  # Import the config module correctly


def create_app(config_object=config.DevelopmentConfig):  # Reference the class within 'config'
    app = Flask(__name__)
    CORS(app, origins="http://localhost:3000", supports_credentials=True)
    
    app.config.from_object(config_object)
    
    db.init_app(app)
    jwt.init_app(app)

    from RoutesTask import tasks_bp
    from RoutesUsers import users_bp

    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(users_bp)

    @app.route('/')
    def index():
        return render_template('index.html')

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
