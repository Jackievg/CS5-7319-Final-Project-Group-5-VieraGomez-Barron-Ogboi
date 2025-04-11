import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/API.js';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Navbar from './components/Navbar.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Dashboard from './components/Dashboard.js';
import TaskDetail from './components/TaskDetail.js';
import CreateTask from './components/CreateTask.js';
import PTO from './components/PTO.js';
import CompanyCalendar from './components/CompanyCalendar.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = authService.getCurrentUser();
    console.log("Current user:", currentUser); 
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.access_token);
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container mt-4">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/tasks/:id" element={user ? <TaskDetail /> : <Navigate to="/login" />} />
            <Route path="/create-task" element={user ? <CreateTask /> : <Navigate to="/login" />} />
            <Route path="/pto" element={user ? <PTO /> : <Navigate to="/login" />} />
            <Route path="/calendar" element={user ? <CompanyCalendar /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;