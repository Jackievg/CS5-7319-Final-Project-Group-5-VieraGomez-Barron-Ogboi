// src/services/websocket.js
const USE_EVENT_DRIVEN = process.env.REACT_APP_USE_EVENTS === 'true';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001'; // Default to Flask-SocketIO port
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

let socket = null;
let reconnectAttempts = 0;
let reconnectTimer = null;

// Event listeners storage
const eventListeners = {
  open: [],
  message: [],
  error: [],
  close: []
};

const addEventListener = (type, callback) => {
  if (eventListeners[type]) {
    eventListeners[type].push(callback);
  }
};

const removeEventListener = (type, callback) => {
  if (eventListeners[type]) {
    eventListeners[type] = eventListeners[type].filter(cb => cb !== callback);
  }
};

const triggerEvent = (type, ...args) => {
  if (eventListeners[type]) {
    eventListeners[type].forEach(callback => callback(...args));
  }
};

const connect = (userId) => {
  if (!USE_EVENT_DRIVEN || socket) return;

  console.log(`Connecting WebSocket to ${WS_URL}...`);
  socket = new WebSocket(`${WS_URL}/socket.io/?user_id=${userId}`);

  socket.onopen = () => {
    reconnectAttempts = 0;
    console.log('WebSocket connected');
    triggerEvent('open');
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      triggerEvent('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      triggerEvent('error', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    triggerEvent('error', error);
    attemptReconnect(userId);
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    triggerEvent('close');
    attemptReconnect(userId);
  };
};

const attemptReconnect = (userId) => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return;
  }

  clearTimeout(reconnectTimer);
  reconnectAttempts++;

  console.log(`Attempting reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  reconnectTimer = setTimeout(() => connect(userId), RECONNECT_DELAY);
};

const disconnect = () => {
  if (socket) {
    console.log('Disconnecting WebSocket...');
    socket.onclose = null; // Prevent reconnect attempts
    socket.close();
    socket = null;
  }
  clearTimeout(reconnectTimer);
};

const send = (data) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
  console.warn('WebSocket not connected - message not sent');
  return false;
};

export const connectWebSocket = (userId, onMessage) => {
  if (!USE_EVENT_DRIVEN) {
    return {
      disconnect: () => {},
      send: () => false
    };
  }

  // Add message listener
  addEventListener('message', onMessage);

  // Connect if not already connected
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connect(userId);
  }

  return {
    disconnect: () => {
      removeEventListener('message', onMessage);
      if (eventListeners.message.length === 0) {
        disconnect();
      }
    },
    send
  };
};

export const disconnectWebSocket = () => {
  disconnect();
};

export const sendMessage = (data) => {
  return send(data);
};