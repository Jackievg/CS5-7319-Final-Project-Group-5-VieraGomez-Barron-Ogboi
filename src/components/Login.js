import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const userData = { username, password };

    // Make the login request to the backend
    axios.post('http://localhost:5000/login', userData)
      .then(response => {
        const { access_token, is_manager, user_id, username } = response.data;

        // Store user data including ID for WebSocket
        localStorage.setItem('user', JSON.stringify({
          id: user_id,
          username,
          isManager: is_manager,
          token: access_token
        }));

        // Store token and user data in localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('is_manager', is_manager);
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('username', username);

        // change back to uncommented if doesnt func properly
        //onLogin({ username, access_token });
        onLogin({ 
          id: user_id,
          username, 
          access_token,
          isManager: is_manager
        });

        // Redirect to the home or dashboard page after login
        navigate('/dashboard');  // Use navigate for redirection
      })
      .catch(error => {
        console.error('Error during login:', error);
        setErrorMessage('Invalid username or password.');
      });
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <h1 className="mb-4">Welcome to Task Manager!</h1>

      <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center mb-4">Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>

        {/* Display error message if login fails */}
        {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}

        <div className="text-center mt-3">
          <small>
            Don’t have an account? <Link to="/register">Register here</Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;



