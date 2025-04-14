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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
      <div className="card p-4 shadow" style={{ maxWidth: '700px', width: '100%' }}>
        <h2 className="text-center mb-4">📅 Company Calendar</h2>
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={tileContent}
        />
      </div>
    </div>
  );
};

export default CompanyCalendar;

