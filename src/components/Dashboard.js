import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-5 shadow" style={{ maxWidth: '600px', width: '100%' }}>
        <h2 className="text-center mb-4">Dashboard</h2>
        <p className="text-center">
          Welcome to your dashboard! 🎯 <br />
          Here you can manage your tasks, view your calendar, and stay on top of everything.
        </p>

        <div className="mt-4 d-flex justify-content-around">
          <button className="btn btn-outline-primary">View Tasks</button>
          <button className="btn btn-outline-secondary">Calendar</button>
          <Link to="/create-task" className="btn btn-outline-success">
            Create New Task
          </Link>
          {/* New PTO Button */}
          <Link to="/pto" className="btn btn-outline-warning">
            PTO Requests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



