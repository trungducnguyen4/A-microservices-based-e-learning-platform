const request = require('supertest');
const express = require('express');
const meetingRoutes = require('../../src/routes/meeting.routes');

const app = express();
app.use(express.json());
app.use('/api/meeting', meetingRoutes);

describe('Meeting API - Integration Tests', () => {
  describe('POST /api/meeting/create', () => {
    test('should create new meeting room', async () => {
      const response = await request(app)
        .post('/api/meeting/create')
        .set('X-User-Id', 'test_user_001')
        .set('X-User-Name', 'Test Teacher')
        .send({
          roomCode: 'INTEGRATION_TEST_001'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.roomCode).toBe('INTEGRATION_TEST_001');
    });

    test('should return 400 for duplicate room code', async () => {
      const roomCode = 'DUPLICATE_ROOM';
      
      // Create first room
      await request(app)
        .post('/api/meeting/create')
        .set('X-User-Id', 'test_user_002')
        .send({ roomCode });
      
      // Try to create duplicate
      const response = await request(app)
        .post('/api/meeting/create')
        .set('X-User-Id', 'test_user_003')
        .send({ roomCode });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/meeting/token', () => {
    test('should generate access token for existing room', async () => {
      const roomCode = 'TOKEN_TEST_ROOM';
      
      // Create room first
      await request(app)
        .post('/api/meeting/create')
        .set('X-User-Id', 'host_user')
        .set('X-User-Name', 'Host User')
        .send({ roomCode });
      
      // Request token
      const response = await request(app)
        .post('/api/meeting/token')
        .set('X-User-Id', 'participant_user')
        .set('X-User-Name', 'Participant User')
        .send({ roomCode });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.roomName).toBe(roomCode);
    });

    test('should return 404 for non-existent room', async () => {
      const response = await request(app)
        .post('/api/meeting/token')
        .set('X-User-Id', 'user_001')
        .send({ roomCode: 'NONEXISTENT_ROOM' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/meeting/rooms', () => {
    test('should list all active rooms', async () => {
      const response = await request(app)
        .get('/api/meeting/rooms');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/meeting/:roomCode', () => {
    test('should delete existing room', async () => {
      const roomCode = 'DELETE_TEST_ROOM';
      
      // Create room
      await request(app)
        .post('/api/meeting/create')
        .set('X-User-Id', 'delete_user')
        .send({ roomCode });
      
      // Delete room
      const response = await request(app)
        .delete(`/api/meeting/${roomCode}`)
        .set('X-User-Id', 'delete_user');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
