import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PTO() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [ptoRequests, setPtoRequests] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  const token = localStorage.getItem('access_token');
  const isManager = localStorage.getItem('is_manager') === 'true'; // Assuming 'true' for manager
  console.log("Token from localStorage:", token)

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/pto', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setPtoRequests(response.data);
      })
      .catch(error => {
        console.error('Error fetching PTO requests:', error);
      });
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create PTO request
    const data = { start_date: startDate, end_date: endDate, reason };
    console.log("Submitting PTO request with:", { startDate, endDate, reason });

    axios.post('http://localhost:5000/pto', data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setStatusMessage('PTO request submitted successfully.');
      setStartDate('');
      setEndDate('');
      setReason('');
    })
    .catch(error => {
      setStatusMessage('Error submitting PTO request.');
      console.error(error);
    });
  };

  const handleStatusChange = (ptoId, newStatus) => {
    // Manager updates PTO request status (approve/reject)
    const data = { status: newStatus };

    axios.put(`http://localhost:5000/pto/${ptoId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setStatusMessage(`PTO request ${newStatus} successfully.`);
      // Refresh the PTO requests after status update
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
    <div>
      <h2>PTO Requests</h2>
      
      {/* Display status message */}
      {statusMessage && <p>{statusMessage}</p>}

      {/* PTO Request Form */}
      {!isManager && (
        <form onSubmit={handleSubmit}>
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Reason:
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <br />
          <button type="submit">Submit PTO Request</button>
        </form>
      )}

      {/* Display PTO requests for users */}
      <h3>Your PTO Requests</h3>
      <ul>
        {ptoRequests.map(pto => (
          <li key={pto.id}>
            {pto.start_date} to {pto.end_date} - {pto.status}
            {!isManager && pto.status === 'Pending' && (
              <span> (Waiting for approval)</span>
            )}
            {isManager && pto.status === 'Pending' && (
              <div>
                <button onClick={() => handleStatusChange(pto.id, 'Approved')}>
                  Approve
                </button>
                <button onClick={() => handleStatusChange(pto.id, 'Declined')}>
                  Decline
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PTO;

