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

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
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
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    if (USE_EVENT_DRIVEN && response.data?.id) {
      sendMessage('/app/tasks.create', {
        eventType: 'TASK_CREATED',
        task: response.data
      });
    }
    return response;
  },
  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    if (USE_EVENT_DRIVEN && response.data?.id) {
      sendMessage('/app/tasks.update', {
        eventType: 'TASK_UPDATED',
        task: response.data
      });
    }
    return response;
  },
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    if (USE_EVENT_DRIVEN) {
      sendMessage('/app/tasks.delete', {
        eventType: 'TASK_DELETED',
        taskId: id
      });
    }
    return response;
  },
  shareTask: async (taskId, userIds) => {
    const response = await api.post(`/tasks/${taskId}/share`, { user_ids: userIds });
    if (USE_EVENT_DRIVEN && response.data?.id) {
      sendMessage('/app/tasks.share', {
        eventType: 'TASK_SHARED',
        task: response.data
      });
    }
    return response;
  }
};

export const ptoService = {
  requestPTO: async (ptoData) => {
    const response = await api.post('/pto', ptoData);
    if (USE_EVENT_DRIVEN && response.data?.id) {
      sendMessage('/app/pto.request', {
        eventType: 'PTO_REQUESTED',
        pto: response.data
      });
    }
    return response;
  },
  updatePTOStatus: async (id, statusData) => {
    const response = await api.put(`/pto/${id}`, statusData);
    if (USE_EVENT_DRIVEN && response.data?.id) {
      sendMessage('/app/pto.update', {
        eventType: 'PTO_UPDATED',
        pto: response.data
      });
    }
    return response;
  },
  getPTORequests: () => fetchWithFallback('/pto')
};

export default api;
