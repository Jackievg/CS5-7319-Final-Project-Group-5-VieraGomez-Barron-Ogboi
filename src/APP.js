import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/API.js';
import { connectWebSocket, disconnectWebSocket } from './services/websocket';
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
import EditTask from './components/EditTask.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Check if user is logged in
    const currentUser = authService.getCurrentUser();
    console.log("Current user:", currentUser); 
    setUser(currentUser);
    setLoading(false);

    if (currentUser) {
      // Connect to WebSocket
      const ws = connectWebSocket(currentUser.id, (message) => {
        console.log('Received message:', message);
        // Global message handler can be added here if needed
      });

      ws.onConnect = () => setConnectionStatus('connected');
      ws.onStompError = () => setConnectionStatus('error');
      ws.onWebSocketClose = () => setConnectionStatus('disconnected');

      return () => {
        disconnectWebSocket();
      };
    }

  }, []);

  const handleLogin = (userData) => {
    const userObj = {
      id: userData.user_id,
      username: userData.username,
      isManager: userData.is_manager,
      token: userData.access_token
    };

    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem('token', userData.access_token);
    setUser(userObj);
    // Connect WebSocket after login
    const ws = connectWebSocket(userData.user_id, (message) => {
      console.log('Received message after login:', message);
    });
    ws.onConnect = () => setConnectionStatus('connected');
  };

  const handleLogout = () => {
    disconnectWebSocket();
    authService.logout();
    setUser(null);
    setConnectionStatus('disconnected');
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          connectionStatus={connectionStatus} 
        />
        <div className="container mt-4">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/tasks/:id" element={user ? <TaskDetail /> : <Navigate to="/login" />} />
            <Route path="/create-task" element={user ? <CreateTask /> : <Navigate to="/login" />} />
            <Route path="/pto" element={user ? <PTO /> : <Navigate to="/login" />} />
            <Route path="/calendar" element={user ? <CompanyCalendar /> : <Navigate to="/login" />} />
            <Route path="/tasks/:id/edit" element={user ? <EditTask /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
