Task Manager Application

Overview 

The Task Manager is a full-stack web application that allows employees to manage task, request paid time off(PTO), and stay updated on company events. The application supports user authentication, task sharing, manager-specific privileges, and calendar visualization.


Features 

º User registration and login (JWT-authenthicated)

º Task creation, updating, deletion

º Task sharing with other 

º PTO request submission and approval by managers 

º Company-wide event managment by managers 

º Responsive calendar with task visualization

º Role-based access control for regular users and managers 

Teck Stack

Backend

º Flask (Python)

º Flask-JWT-Extended (JWT authentication)

º Flask-CORS

º SQLAlchemy (ORM)

º SQLite (default database, configurable)

Frontend

º React

º Bootstrap

º React Router

º React Calendar

º Axios (for API calls)

Project Structure 

project/
├── backend/
│   ├── models.py           # Database models
│   ├── extensions.py       # Flask extensions
│   ├── config.py           # Application configuration
│   ├── app.py              # Main Flask application
│   ├── RoutesTask.py       # Task-related routes
│   └── RoutesUsers.py      # User-related routes
│

└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   │   ├── Dashboard.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── CreateTask.js
    │   │   ├── TaskDetail.js
    │   │   ├── EditTask.js
    │   │   ├── PTO.js
    │   │   ├── CompanyCalendar.js
    │   │   └── Navbar.js
    │   ├── services/       # API services
    │   └── App.js          # Main React component
    └── public/             # Static files

Setup Instructions


You will need to create two separate terminals ( one for the backend commands, one for the front end commands)

Backend (Flask)

1. Create and activate a virtual environment:
	python3 -m venv venv
	source venv/bin/activate
2. install dependencies:
	pip install -r requirements.txt
3. Set environment variables and run the app:
	export FLASK_APP=app.py
	export FLASK_ENV=development
	flask run



should your computer allow it/ all flask dependencies are installed, you can also run:


python app.py

Frontend (React)

1. install dependencies:
	nmp install
2.Run the development server:
	nmp start


API Endpoints

User Autherntication

º POST/register - Register a new user

º POST/login - Aunthenticate a user and receive JWT token

Task Managment 

º GET/tasks - Get all tasks for authenticated user 

º POST/ task - Create a new task

º GET/tasks/:id - Get a specific task

º PUT/tasks/:id - Update a task

º DELETE/task/:id - Delete a task

PTO Managment 

º GET/pto - Get all PTO request

º POST/pto - Create a new PTO request

º PUT/pto/:id - Update PTO request status (for managers)

Company Events 

º Get/tasks/events - Get all company events 

º POST/task/events - Create a new company event (for managers)

User Roles

Regular Users

º Create and manage their own tasks

º Share tasks with other users 

º Submit PTO request

º View company calendar and events 

Managers

º All regular user capabilities 

º Approve or reject PTO requests

º Create company-wide events

Database Schema 

The application uses the following datbase models:

º User - Stores user information

º Task - Stores task information

º TaskShare - Manages task sharing between users 

º PTORequest - Manages PTO requests and approvals 

º CompanyEvent - Stores company-wide events

Future Improvements 

º Pagination and search

º Email notifications

º Enhanced calendar with filters 
