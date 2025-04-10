import React from 'react';
import ReactDOM from 'react-dom';
import App from './APP'; // Adjust path if necessary
import './index.css'; // Optional: You can add global styles if needed

// Render the App component to the DOM
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // This assumes you have an HTML element with id="root"
);
