import axios from 'axios';
import { sendMessage } from './websocket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
//removed api for localhost
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
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to maintain compatibility
const fetchWithFallback = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('access_token')}`,
        ...options.headers
      }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Fetch error, trying axios:', error);
    // Fallback to axios
    const method = options.method || 'GET';
    try {
      const axiosResponse = await api({
        method,
        url,
        data: options.body ? JSON.parse(options.body) : undefined
      });
      return axiosResponse.data;
    } catch (axiosError) {
      console.error('Both fetch and axios failed:', axiosError);
      throw axiosError;
    }
  }
};



// Auth services
export const authService = {
  //took /users/
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};//checking if works


// Task services
export const taskService = {
  getTasks: () => fetchWithFallback('/tasks'),
  getTask: (id) => fetchWithFallback(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};


// PTO services
export const ptoService = {
  requestPTO: (ptoData) => api.post('/pto', ptoData),
  getPTORequests: () => fetchWithFallback('/pto'),
  updatePTOStatus: (id, statusData) => api.put(`/pto/${id}`, statusData),
};

export default api;