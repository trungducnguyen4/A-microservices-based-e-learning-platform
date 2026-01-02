const { AccessToken } = require('livekit-server-sdk');
const livekitConfig = require('../config/livekit.config');
const roomService = require('./room.service');
const userService = require('./user.service');

/**
 * Service để tạo và quản lý LiveKit tokens
 */
class TokenService {
  /**
   * Tạo access token cho participant
   */
  async createAccessToken(roomCode, userId, userName = null) {
    try {
      // Validate LiveKit config
      if (!livekitConfig.validateConfig()) {
        throw new Error('LiveKit configuration is incomplete');
      }

      // Get user info if userName not provided
      let participantName = userName;
      if (!participantName && userId) {
        try {
          const userInfo = await userService.getUserInfo(userId);
          participantName = userService.getDisplayName(userInfo, userId);
        } catch (err) {
          console.warn(`[TokenService] Failed to get user info, using userId as name:`, err.message);
          participantName = userId;
        }
      }
      
      // Fallback nếu vẫn không có name
      if (!participantName) {
        participantName = userId || `user_${Date.now()}`;
      }

      // Create token - IMPORTANT: identity phải là display name (như code cũ)
      // Không dùng userId làm identity vì LiveKit cần identity là unique string
      const identity = participantName;
      
      const token = new AccessToken(
        livekitConfig.apiKey,
        livekitConfig.apiSecret,
        {
          identity: identity,
          metadata: JSON.stringify({
            userId: userId || null,
            displayName: participantName,
            joinedAt: new Date().toISOString(),
          })
        }
      );

      // Grant permissions
      token.addGrant({
        room: roomCode,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();

      console.log(`[TokenService] Token created for user ${participantName} in room ${roomCode}`);

      return {
        token: jwt,
        identity: identity,
        name: participantName,
        roomCode: roomCode,
        userId: userId, // Giữ userId riêng để tracking
      };
    } catch (error) {
      console.error('[TokenService] Error creating token:', error);
      throw error;
    }
  }

  /**
   * Tạo token và track participant trong room
   */
  async createTokenAndTrackParticipant(roomCode, userId, userName = null) {
    const tokenData = await this.createAccessToken(roomCode, userId, userName);

    // Add participant to room với userId để check host
    roomService.addParticipant(roomCode, {
      identity: tokenData.identity,
      name: tokenData.name,
      userId: tokenData.userId || userId, // Đảm bảo luôn có userId
      joinedAt: new Date(),
    });

    return tokenData;
  }
}

// Singleton instance
const tokenService = new TokenService();

module.exports = tokenService;
