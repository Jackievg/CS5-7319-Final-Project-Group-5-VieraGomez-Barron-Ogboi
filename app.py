
from flask import Flask, render_template, request,  make_response
from flask_cors import CORS
from extensions import db, jwt
import config  # Import the config module correctly


def create_app(config_object=config.DevelopmentConfig):  # Reference the class within 'config'
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000", "http://localhost:3001"], supports_credentials=True)

    app.config.from_object(config_object)
    
    db.init_app(app)
    jwt.init_app(app)

    from RoutesTask import tasks_bp
    from RoutesUsers import users_bp

    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)
    
    # Explicitly handle preflight (OPTIONS) requests
    @app.before_request
    def before_request():
        if request.method == "OPTIONS":
            # Manually add CORS headers to the preflight response
            response = make_response('', 200)  # Respond with 200 OK
            response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'  # Allow the origin you want
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'  # Allowed methods
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'  # Allowed headers
            response.headers['Access-Control-Allow-Credentials'] = 'true'  # Support credentials
            return response

        
    @app.route('/')
    def index():
        return render_template('index.html')

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

