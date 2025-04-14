import axios from 'axios';
import { sendMessage } from './websocket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080';


// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hybrid service methods
const createWithRealtime = async (endpoint, data, eventType) => {
  const response = await api.post(endpoint, data);
  sendMessage(`/app/${endpoint}`, {
    eventType,
    payload: response.data
  });
  return response;
};

const updateWithRealtime = async (endpoint, id, data, eventType) => {
  const response = await api.put(`${endpoint}/${id}`, data);
  sendMessage(`/app/${endpoint}.update`, {
    eventType,
    payload: response.data
  });
  return response;
};

const deleteWithRealtime = async (endpoint, id, eventType) => {
  const response = await api.delete(`${endpoint}/${id}`);
  sendMessage(`/app/${endpoint}.delete`, {
    eventType,
    payload: { id }
  });
  return response;
};


// Auth services
export const authService = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
//stoped here 
// Task services
export const taskService = {
  getTasks: () => api.get('/tasks'),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => createWithRealtime('/tasks', taskData, 'TASK_CREATED'),
  updateTask: (id, taskData) => updateWithRealtime('/tasks', id, taskData, 'TASK_UPDATED'),
  deleteTask: (id) => deleteWithRealtime('/tasks', id, 'TASK_DELETED'),
  
  // Hybrid method for realtime updates
  subscribeToUpdates: (userId, callback) => {
    return connectWebSocket(userId, callback);
  }
};

// PTO services
export const ptoService = {
  requestPTO: (ptoData) => createWithRealtime('/users/pto', ptoData, 'PTO_CREATED'),
  getPTORequests: () => api.get('/users/pto'),
  updatePTOStatus: (id, statusData) => updateWithRealtime('/users/pto', id, statusData, 'PTO_UPDATED'),
};

// Company event services
export const eventService = {
  getEvents: () => api.get('/tasks/events'),
  createEvent: (eventData) => createWithRealtime('/tasks/events', eventData, 'EVENT_CREATED'),
};

export default api;