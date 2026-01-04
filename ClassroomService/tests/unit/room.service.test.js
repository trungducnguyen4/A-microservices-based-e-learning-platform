const roomService = require('../../src/services/room.service');

describe('RoomService - Unit Tests', () => {
  describe('Room Creation', () => {
    test('should create a new room with valid roomCode and userId', async () => {
      const roomCode = 'TEST123';
      const userId = 'user_001';
      
      const room = await roomService.createRoom(roomCode, userId);
      
      expect(room).toBeDefined();
      expect(room.roomCode).toBe(roomCode);
      expect(room.hostUserId).toBe(userId);
      expect(room.status).toBe('active');
    });

    test('should throw error when creating room with duplicate roomCode', async () => {
      const roomCode = 'DUPLICATE';
      const userId = 'user_001';
      
      await roomService.createRoom(roomCode, userId);
      
      await expect(roomService.createRoom(roomCode, userId))
        .rejects.toThrow();
    });
  });

  describe('Room Retrieval', () => {
    test('should retrieve existing room by roomCode', async () => {
      const roomCode = 'EXIST123';
      const userId = 'user_002';
      
      await roomService.createRoom(roomCode, userId);
      const room = await roomService.getRoom(roomCode);
      
      expect(room).toBeDefined();
      expect(room.roomCode).toBe(roomCode);
    });

    test('should return null for non-existent room', async () => {
      const room = await roomService.getRoom('NONEXISTENT');
      expect(room).toBeNull();
    });
  });

  describe('Room Status', () => {
    test('should check if room exists', async () => {
      const roomCode = 'CHECK123';
      const userId = 'user_003';
      
      await roomService.createRoom(roomCode, userId);
      
      const exists = await roomService.hasRoom(roomCode);
      expect(exists).toBe(true);
    });

    test('should return false for non-existent room', async () => {
      const exists = await roomService.hasRoom('NOTHERE');
      expect(exists).toBe(false);
    });
  });

  describe('Room Deletion', () => {
    test('should delete existing room', async () => {
      const roomCode = 'DELETE123';
      const userId = 'user_004';
      
      await roomService.createRoom(roomCode, userId);
      await roomService.deleteRoom(roomCode);
      
      const exists = await roomService.hasRoom(roomCode);
      expect(exists).toBe(false);
    });
  });

  afterEach(async () => {
    // Cleanup: Delete all test rooms
    const rooms = await roomService.getAllRooms();
    for (const [roomCode] of rooms) {
      if (roomCode.startsWith('TEST') || roomCode.startsWith('DUPLICATE') || 
          roomCode.startsWith('EXIST') || roomCode.startsWith('CHECK') || 
          roomCode.startsWith('DELETE')) {
        await roomService.deleteRoom(roomCode).catch(() => {});
      }
    }
  });
});
