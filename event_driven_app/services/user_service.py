from shared.models import db, User
from flask_bcrypt import generate_password_hash, check_password_hash

def register_user(username, email, password, is_manager=False):
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return None  # User exists
    
    user = User(
        username=username,
        email=email,
        is_manager=is_manager
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user

def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        return user
    return None