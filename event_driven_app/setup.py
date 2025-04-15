# setup.py
from setuptools import setup, find_packages

setup(
    name="event_driven_app",
    version="0.1",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        'flask>=2.0.1',
        'flask-socketio>=5.3.4',
        'python-dotenv>=0.19.0'
    ],
)