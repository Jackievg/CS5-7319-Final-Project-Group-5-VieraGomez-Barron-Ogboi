import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CompanyCalendar = () => {
  const [tasks, setTasks] = useState([]);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found!');
        return;
      }

      const response = await fetch('http://localhost:5000/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
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
  }, []);

  const tileContent = ({ date, view }) => {
    const formattedDate = date.toISOString().split('T')[0];
    const tasksForDay = tasks.filter(task => {
      const taskDate = task.deadline ? task.deadline.split('T')[0] : null;
      return taskDate === formattedDate;
    });
  
    if (view === 'month' && tasksForDay.length > 0) {
      return (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 4,
          fontSize: '0.65em',
          lineHeight: 1.2,
          maxHeight: '60px',
          overflowY: 'auto'
        }}>
          {tasksForDay.map((task, i) => (
            <li key={i} style={{
              color: 'red',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {task.title}
            </li>
          ))}
        </ul>
      );
    }
  
    return null;
  };
  

  return (
    <div className="bg-light" style={{ minHeight: '100vh', padding: '2rem' }}>
    <div 
      className="card mx-auto shadow"
      style={{
        maxWidth: '1000px',
        padding: '2rem',
        borderRadius: '20px',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <h2 className="text-center mb-4" style={{ color: '#6c5ce7' }}>
         Company Calendar View 
      </h2>
      <div className="d-flex justify-content-center">
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
          }}
        >
          <Calendar
            onChange={setDate}
            value={date}
            tileContent={tileContent}
            className="w-100"
          />
          <p className="text-center mt-4" style={{ fontStyle: 'italic', color: '#636e72' }}>
  "Small steps every day lead to big journeys. You've got this!"
</p>
        </div>
      </div>
    </div>
  </div>
  );
};

export default CompanyCalendar;

