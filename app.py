from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import.JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_object="Config.DevelopmentConfig"):
	app = Flask(_name_)
	app.config.from_object(config_object)
	
	CORS(app)
	db.init_app(app)
	jwt.init_app(app)
	
	from routes.tasks import tasks_bp
	from routes.users import users_bp

	app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
	app.register_blueprint(users_bp, url_prefix='/api/users')

	with app.app_context():
		db.create_all()

	return app

if _name_ == "_main_":
	app = create_app()
	app.run(debug=True)
