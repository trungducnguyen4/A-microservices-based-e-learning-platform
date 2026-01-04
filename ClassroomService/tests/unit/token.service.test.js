const tokenService = require('../../src/services/token.service');

describe('TokenService - Unit Tests', () => {
  describe('Token Generation', () => {
    test('should generate valid token for user', async () => {
      const roomCode = 'ROOM001';
      const userId = 'user_test';
      const userName = 'Test User';
      
      const tokenData = await tokenService.createTokenAndTrackParticipant(
        roomCode,
        userId,
        userName
      );
      
      expect(tokenData).toBeDefined();
      expect(tokenData.token).toBeDefined();
      expect(tokenData.identity).toBeDefined();
      expect(tokenData.name).toBe(userName);
      expect(tokenData.roomCode).toBe(roomCode);
    });

    test('should generate unique identity for each participant', async () => {
      const roomCode = 'ROOM002';
      
      const token1 = await tokenService.createTokenAndTrackParticipant(
        roomCode, 'user1', 'User One'
      );
      
      const token2 = await tokenService.createTokenAndTrackParticipant(
        roomCode, 'user2', 'User Two'
      );
      
      expect(token1.identity).not.toBe(token2.identity);
    });
  });

  describe('Token Validation', () => {
    test('should include room name in token metadata', async () => {
      const roomCode = 'METADATA_TEST';
      const tokenData = await tokenService.createTokenAndTrackParticipant(
        roomCode, 'user_meta', 'Meta User'
      );
      
      expect(tokenData.roomCode).toBe(roomCode);
    });
  });
});
