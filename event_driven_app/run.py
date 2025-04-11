from app import create_app
from shared.models import db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # initialize EDA database
    app.run(port=5001)   #different port than layered app 