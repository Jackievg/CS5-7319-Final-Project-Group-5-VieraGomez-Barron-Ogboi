import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-123')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key-123')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///eda_tasks.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost:5672')  # Added explicit port