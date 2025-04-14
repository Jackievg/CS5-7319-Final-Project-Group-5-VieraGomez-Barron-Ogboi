import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/API.js';
import { connectWebSocket, disconnectWebSocket, sendMessage } from '../services/websocket';


const Dashboard = () => {
  const [tasks, setTasks] = useState([]);

  // Fetch tasks when the component loads
  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
          console.error('No token found!');
          return;
      }
      const response = await fetch('http://localhost:5000/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Error fetching tasks');
      }
    };

    fetchTasks();

// Set up WebSocket for real-time updates
const user = JSON.parse(localStorage.getItem('user'));
if (user && user.id) {
  const ws = connectWebSocket(user.id, (message) => {
    if (message.eventType === 'TASK_UPDATED') {
      setTasks(prev => prev.map(t => t.id === message.task.id ? message.task : t));
    } else if (message.eventType === 'TASK_CREATED') {
      setTasks(prev => [...prev, message.task]);
    } else if (message.eventType === 'TASK_DELETED') {
      setTasks(prev => prev.filter(t => t.id !== message.taskId));
    }
  });

  return () => {
    disconnectWebSocket();
  };
}

  }, []);

  const handleEdit = (taskId) => {
    // Redirect to task edit page
    window.location.href = `/tasks/${taskId}/edit`;
  };

  const handleDelete = async (taskId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      //WebSocket notification after successful REST deletion
      sendMessage('/app/tasks.delete', {
        eventType: 'TASK_DELETED',
        taskId: taskId
      });
      setTasks(tasks.filter(task => task.id !== taskId));
    } else {
      console.error('Error deleting task');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-5 shadow" style={{ maxWidth: '600px', width: '100%' }}>
        <h2 className="text-center mb-4">Dashboard</h2>
        <p className="text-center">
          Welcome to your dashboard! 🎯 <br />
          Here you can manage your tasks, see your PTO requests, and stay on top of everything!
        </p>

        {/* Display User's Tasks */}
        <div className="mt-4">
          <h4>Your Tasks:</h4>
          <ul className="list-group">
            {tasks.map((task) => (
              <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
              <strong>{task.title}</strong><br />
  {task.completed ? (
    <span className="text-success">Complete</span>
  ) : (
    task.deadline ? (
      <span className="text-muted">Deadline: {task.deadline}</span>
    ) : (
      <span className="text-muted">No deadline set</span>
    )
  )}
</div>
                <div>
                  <button
                    className="btn btn-warning btn-sm mx-2"
                    onClick={() => handleEdit(task.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Other Dashboard Actions */}
        <div className="mt-4 d-flex justify-content-around">
          <Link to="/calendar" className="btn btn-outline-secondary">
            Calender
          </Link>
          <Link to="/create-task" className="btn btn-outline-success">
            Create New Task
          </Link>
          <Link to="/pto" className="btn btn-outline-warning">
            PTO Requests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



