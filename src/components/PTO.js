import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

function PTO() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [ptoRequests, setPtoRequests] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  const token = localStorage.getItem('access_token');
  const isManager = localStorage.getItem('is_manager') === 'true';

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/pto', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setPtoRequests(response.data);
      });
      // WebSocket connection for real-time updates
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        const ws = connectWebSocket(user.id, (message) => {
          if (message.eventType === 'PTO_UPDATED') {
            setPtoRequests(prev => prev.map(req => 
              req.id === message.pto.id ? message.pto : req
            ));
          } else if (message.eventType === 'PTO_CREATED') {
            setPtoRequests(prev => [...prev, message.pto]);
          }
        });

        return () => disconnectWebSocket();
      }
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { start_date: startDate, end_date: endDate, reason };

    axios.post('http://localhost:5000/pto', data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setStatusMessage('PTO request submitted successfully.');
      setStartDate('');
      setEndDate('');
      setReason('');
      // Refresh list
      setPtoRequests(prev => [...prev, response.data]);
    })
    .catch(error => {
      setStatusMessage('Error submitting PTO request.');
      console.error(error);
    });
  };

  const handleStatusChange = (ptoId, newStatus) => {
    const data = { status: newStatus };

    axios.put(`http://localhost:5000/pto/${ptoId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setStatusMessage(`PTO request ${newStatus} successfully.`);
      setPtoRequests(prevState =>
        prevState.map(request =>
          request.id === ptoId ? { ...request, status: newStatus } : request
        )
      );
    })
    .catch(error => {
      setStatusMessage('Error updating PTO request status.');
      console.error(error);
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">PTO Requests</h2>

      {statusMessage && (
        <div className="alert alert-info">{statusMessage}</div>
      )}

      {!isManager && (
        <form onSubmit={handleSubmit} className="mb-4 card p-4 shadow-sm">
          <h4 className="mb-3">Submit a PTO Request</h4>
          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Reason</label>
            <input
              type="text"
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      )}

      <h4 className="mb-3">Your PTO Requests</h4>
      <ul className="list-group">
        {ptoRequests.map(pto => (
          <li key={pto.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{pto.start_date}</strong> to <strong>{pto.end_date}</strong> - <span className={`badge bg-${pto.status === 'Approved' ? 'success' : pto.status === 'Declined' ? 'danger' : 'secondary'}`}>{pto.status}</span>
              {!isManager && pto.status === 'Pending' && (
                <small className="text-muted ms-2">(Waiting for approval)</small>
              )}
            </div>
            {isManager && pto.status === 'Pending' && (
              <div className="btn-group">
                <button className="btn btn-outline-success btn-sm" onClick={() => handleStatusChange(pto.id, 'Approved')}>Approve</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleStatusChange(pto.id, 'Declined')}>Decline</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PTO;


