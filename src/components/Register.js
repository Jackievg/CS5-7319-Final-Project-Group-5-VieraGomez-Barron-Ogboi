import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate(); // Use navigate for redirection

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const newUser = { username, email, password, is_manager: isManager };

    // Send the request to the backend to register the user
    axios.post('http://localhost:5000/register', newUser)
      .then(response => {
        setSuccessMessage(response.data.message);
        setErrorMessage('');  // Reset error message
        setTimeout(() => navigate('/login'), 2000); // Redirect to login after success
      })
      .catch(error => {
        console.error('Error during registration:', error);
        setErrorMessage(error.response?.data?.message || 'Failed to register. Try again.');
      });
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <h1 className="mb-4">Register for Task Manager!</h1>

      <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center mb-4">Create an Account</h3>
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
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="isManager"
              checked={isManager}
              onChange={(e) => setIsManager(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isManager">I am a Manager</label>
          </div>
          <button type="submit" className="btn btn-primary w-100">Register</button>
        </form>

        {/* Display error message if registration fails */}
        {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
        {/* Display success message if registration succeeds */}
        {successMessage && <p className="text-success mt-3">{successMessage}</p>}

        <div className="text-center mt-3">
          <small>
            Already have an account? <Link to="/login">Login here</Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Register;

