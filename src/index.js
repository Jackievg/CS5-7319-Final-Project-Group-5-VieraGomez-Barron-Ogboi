import React from 'react';
import { createRoot } from 'react-dom/client'; 
import App from './App';  
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Get the root DOM element
const container = document.getElementById('root');

// Create a root instance and render the app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);