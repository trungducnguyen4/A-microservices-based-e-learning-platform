const roomService = require('../services/room.service');
const tokenService = require('../services/token.service');

/**
 * Controller xử lý các request liên quan đến meeting/room
 */
class MeetingController {
  /**
   * Tạo phòng meeting mới
   * POST /api/meeting/create
   */
  async createRoom(req, res) {
    try {
      const { roomCode, userId } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      // Check if room already exists
      if (roomService.hasRoom(roomCode)) {
        return res.status(409).json({
          success: false,
          message: 'Room already exists',
        });
      }

      // Create room
      const room = roomService.createRoom(roomCode, userId);

      console.log(`[MeetingController] Room created: ${roomCode} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: {
          roomCode: room.roomCode,
          createdAt: room.createdAt,
        },
      });
    } catch (error) {
      console.error('[MeetingController] Error creating room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create room',
        error: error.message,
      });
    }
  }

  /**
   * Kiểm tra phòng có tồn tại không
   * GET /api/meeting/check/:roomCode
   */
  async checkRoom(req, res) {
    try {
      const { roomCode } = req.params;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      const exists = roomService.hasRoom(roomCode);
      const room = exists ? roomService.getRoom(roomCode) : null;

      res.json({
        success: true,
        exists,
        data: exists
          ? {
              roomCode: room.roomCode,
              createdAt: room.createdAt,
              participantCount: room.participants.size,
            }
          : null,
      });
    } catch (error) {
      console.error('[MeetingController] Error checking room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check room',
        error: error.message,
      });
    }
  }

  /**
   * Lấy danh sách tất cả phòng
   * GET /api/meeting/rooms
   */
  async getAllRooms(req, res) {
    try {
      const rooms = roomService.getAllRooms();

      const roomList = Array.from(rooms.values()).map((room) => ({
        roomCode: room.roomCode,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        participantCount: room.participants.size,
        participants: Array.from(room.participants.values()),
      }));

      res.json({
        success: true,
        count: roomList.length,
        data: roomList,
      });
    } catch (error) {
      console.error('[MeetingController] Error getting rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rooms',
        error: error.message,
      });
    }
  }

  /**
   * Xóa phòng
   * DELETE /api/meeting/room/:roomCode
   */
  async deleteRoom(req, res) {
    try {
      const { roomCode } = req.params;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      if (!roomService.hasRoom(roomCode)) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }

      roomService.deleteRoom(roomCode);

      console.log(`[MeetingController] Room deleted: ${roomCode}`);

      res.json({
        success: true,
        message: 'Room deleted successfully',
      });
    } catch (error) {
      console.error('[MeetingController] Error deleting room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete room',
        error: error.message,
      });
    }
  }

  /**
   * Lấy token để tham gia phòng
   * POST /api/meeting/token
   */
  async getToken(req, res) {
    try {
      const { roomCode, userId, userName } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      // Create token and track participant
      const tokenData = await tokenService.createTokenAndTrackParticipant(
        roomCode,
        userId,
        userName
      );

      res.json({
        success: true,
        data: tokenData,
      });
    } catch (error) {
      console.error('[MeetingController] Error getting token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate token',
        error: error.message,
      });
    }
  }
}

// Export singleton instance
module.exports = new MeetingController();
