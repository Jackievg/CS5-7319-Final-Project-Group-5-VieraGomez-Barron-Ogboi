# from flask import Flaskpip 
from flask import Flask 
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_object="Config.DevelopmentConfig"):
	app = Flask(__name__)
	app.config.from_object(config_object)
	
	CORS(app)
	db.init_app(app)
	jwt.init_app(app)
	
	from RoutesTask import tasks_bp
	from RoutesUsers import users_bp

	app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
	app.register_blueprint(users_bp, url_prefix='/api/users')

	with app.app_context():
		db.create_all()

	return app

if __name__ == "_main_":
	app = create_app()
	app.run(debug=True)
