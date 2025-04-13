from setuptools import setup, find_packages

setup(
    name="task_manager",
    version="0.1",
    packages=find_packages(),  # Automatically finds all packages
    install_requires=[
        'flask==2.0.1',
        'flask-sqlalchemy==2.5.1',
        'flask-bcrypt==1.0.1',
        'pika==1.3.2',
        'python-dotenv==0.19.0'
    ],
)