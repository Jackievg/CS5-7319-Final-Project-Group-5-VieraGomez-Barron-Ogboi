import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { sendMessage } from '../services/websocket';


const CreateTask = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [sharedWith, setSharedWith] = useState([]);  // For storing shared usernames
    const [showModal, setShowModal] = useState(false);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      const taskData = { 
        title, 
        description, 
        deadline: dueDate,
        shared_with: sharedWith 
      };

      console.log("📦 Sending task data:", taskData);
  
      try {

        const token = localStorage.getItem('access_token');
        console.log('Token from localStorage:', token);

        const response = await fetch('http://localhost:5000/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // Send WebSocket notification after successful REST creation
          sendMessage('/app/tasks.create', {
            eventType: 'TASK_CREATED',
            task: data
          });

          console.log('Task created successfully:', data);
          setShowModal(true);
          setTitle('');
          setDescription('');
          setDueDate('');
          setSharedWith([]);
        } else {
          console.error('Error creating task:', data.message || data.msg || 'Unknown error');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
  
    return (
      <div className="container mt-5">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Task Title</label>
            <input
              type="text"
              className="form-control"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              className="form-control"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="dueDate" className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="sharedWith" className="form-label">Share with (usernames)</label>
            <input
              type="text"
              className="form-control"
              id="sharedWith"
              value={sharedWith.join(', ')}
              onChange={(e) => setSharedWith(e.target.value.split(',').map((user) => user.trim()))}
            />
            <small className="form-text text-muted">Separate usernames by commas</small>
          </div>
          <button type="submit" className="btn btn-primary">Create Task</button>
        </form>
  
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Task Created!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Task has been successfully created!</p>
            <div className="d-flex justify-content-between">
              <a href="/" className="btn btn-secondary">Back to Dashboard</a>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  };
  
  export default CreateTask;