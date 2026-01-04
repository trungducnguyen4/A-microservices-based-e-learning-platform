/**
 * Classroom API Service
 * Handles all API calls to ClassroomService through API Gateway
 */

import axios from 'axios';

// Use API Gateway base URL
const API_GATEWAY_BASE = import.meta.env.VITE_API_BASE || '/api';

export const classroomApi = axios.create({
  baseURL: `${API_GATEWAY_BASE}/classrooms`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth interceptor
classroomApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
classroomApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[ClassroomAPI] Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Classroom API service methods
 */
export const classroomService = {
  /**
   * Get LiveKit token for joining a room
   */
  getToken: async (roomName: string, userName: string, userId?: string, role?: string) => {
    const params: any = { room: roomName, user: userName };
    if (userId) params.userId = userId;
    if (role) params.role = role;
    
    const response = await classroomApi.get('/getToken', { params });
    return response.data;
  },

  /**
   * Check if a room exists
   */
  checkRoom: async (roomCode: string) => {
    const response = await classroomApi.get(`/meeting/check/${roomCode}`);
    return response.data;
  },

  /**
   * Create a new room
   */
  createRoom: async (roomCode: string, userId: string) => {
    const response = await classroomApi.post('/meeting/create', {
      roomCode,
      userId
    });
    return response.data;
  },

  /**
   * Get room info
   */
  getRoomInfo: async (roomName: string) => {
    const response = await classroomApi.get(`/rooms/${roomName}`);
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    const response = await classroomApi.get('/health');
    return response.data;
  },

  /**
   * Notify that a participant has left the room
   * Returns whether the room is now empty
   */
  notifyParticipantLeft: async (roomCode: string, identity: string) => {
    const response = await classroomApi.post('/meeting/participant-left', {
      roomCode,
      identity,
    });
    return response.data;
  },

  /**
   * Send a chat message to the room (save to DB)
   */
  sendMessage: async (roomCode: string, senderUserId: string | null, senderName: string, content: string) => {
    const response = await classroomApi.post('/meeting/message', {
      roomCode,
      senderUserId,
      senderName,
      content,
      messageType: 'text',
    });
    return response.data;
  },

  /**
   * Get messages for a room
   */
  getMessages: async (roomCode: string, limit: number = 100) => {
    const response = await classroomApi.get(`/meeting/messages/${roomCode}`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * End a room (only host can end)
   */
  endRoom: async (roomCode: string, userId: string) => {
    const response = await classroomApi.post(`/meeting/end/${roomCode}`, {
      userId,
    });
    return response.data;
  },

  /**
   * Kick a participant from the room (only host can kick)
   */
  kickParticipant: async (roomCode: string, hostUserId: string, targetIdentity: string) => {
    const response = await classroomApi.post('/meeting/kick-participant', {
      roomCode,
      hostUserId,
      targetIdentity,
    });
    return response.data;
  },
};

export default classroomService;
