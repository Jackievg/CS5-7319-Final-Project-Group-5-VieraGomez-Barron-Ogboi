import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    deadline: '',
    category: 'work',
  });

  const token = localStorage.getItem('token');

  // Fetch the task details when the component mounts
  useEffect(() => {
    const fetchTask = async () => {
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTask(data);
      setTaskData({
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        category: data.category,
      });
    };

    fetchTask();
  }, [id, token]);

  // Handle task data change (for editing)
  const handleChange = (e) => {
    setTaskData({
      ...taskData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle task update
  const handleUpdate = async () => {
    const response = await fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      const updatedTask = await response.json();
      setTask(updatedTask);
      setIsEditing(false); // Exit edit mode
    } else {
      console.error('Error updating task');
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    const response = await fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      navigate('/tasks'); // Redirect to tasks list after deletion
    } else {
      console.error('Error deleting task');
    }
  };

  if (!task) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mt-5">
      <h2>{isEditing ? 'Edit Task' : 'Task Details'}</h2>

      {isEditing ? (
        <div>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={taskData.title}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={taskData.description}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="mb-3">
            <label htmlFor="deadline" className="form-label">Deadline</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              className="form-control"
              value={taskData.deadline}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              name="category"
              className="form-control"
              value={taskData.category}
              onChange={handleChange}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button onClick={handleUpdate} className="btn btn-primary">Update Task</button>
          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-secondary ms-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <h5>{task.title}</h5>
          <p><strong>Description:</strong> {task.description}</p>
          <p><strong>Deadline:</strong> {task.deadline}</p>
          <p><strong>Category:</strong> {task.category}</p>
          <p><strong>Created At:</strong> {task.created_at}</p>

          <button
            className="btn btn-warning"
            onClick={() => setIsEditing(true)}
          >
            Edit Task
          </button>
          <button className="btn btn-danger ms-2" onClick={handleDelete}>
            Delete Task
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;


