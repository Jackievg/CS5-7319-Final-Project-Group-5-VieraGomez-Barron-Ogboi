import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sendMessage } from '../services/websocket';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    category: '',
    completed: false,
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://localhost:5000/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTask(data);
        setForm({
          title: data.title,
          description: data.description,
          deadline: data.deadline ? data.deadline.slice(0, 10) : '',
          category: data.category,
          completed: data.completed,
        });
      })
      .catch(err => console.error('Failed to load task:', err));
  }, [id, token]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then((updatedTask) => {
        // Send WebSocket notification after successful REST update
        sendMessage('/app/tasks.update', {
          eventType: 'TASK_UPDATED',
          task: updatedTask
        });
        navigate('/'); // Go back to dashboard after saving
      })
      .catch(err => console.error('Failed to update task:', err));
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <h2>Edit Task</h2>
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input name="title" className="form-control" value={form.title} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" value={form.description} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Deadline</label>
          <input type="date" name="deadline" className="form-control" value={form.deadline} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Category</label>
          <input name="category" className="form-control" value={form.category} onChange={handleChange} />
        </div>
        <div className="form-check mb-3">
          <input type="checkbox" className="form-check-input" id="completed" name="completed" checked={form.completed} onChange={handleChange} />
          <label className="form-check-label" htmlFor="completed">Completed</label>
        </div>
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default EditTask;
