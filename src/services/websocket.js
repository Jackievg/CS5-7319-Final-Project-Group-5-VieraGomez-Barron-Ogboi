import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const connectWebSocket = (userId, onMessageReceived) => {
  const socket = new SockJS('http://localhost:5000/ws');
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => console.log('STOMP: ' + str),
  });

  stompClient.onConnect = (frame) => {
    reconnectAttempts = 0;
    console.log('Connected: ' + frame);
    
    // Subscribe to user-specific queue
    stompClient.subscribe(`/user/${userId}/queue/updates`, (message) => {
      onMessageReceived(JSON.parse(message.body));
    });

    // Subscribe to general task updates
    stompClient.subscribe('/topic/tasks', (message) => {
      onMessageReceived(JSON.parse(message.body));
    });

    // Subscribe to PTO updates
    stompClient.subscribe('/topic/pto', (message) => {
      onMessageReceived(JSON.parse(message.body));
    });
  };

  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
  };

  stompClient.onWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    if (reconnectAttempts++ >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      stompClient.deactivate();
    }
  };

  stompClient.onWebSocketClose = () => {
    console.log('WebSocket connection closed');
  };

  stompClient.activate();
  return stompClient;
};

export const disconnectWebSocket = () => {
  if (stompClient !== null) {
    stompClient.deactivate();
    stompClient = null;
  }
};

export const sendMessage = (destination, body) => {
  if (stompClient && stompClient.connected) {
    try {
      stompClient.publish({
        destination,
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' }
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
  console.warn('WebSocket not connected - message not sent');
  return false;
};