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
              hostUserId: room.hostUserId,
              hostName: (() => {
                const hostParticipant = Array.from(room.participants.values()).find(p => p.userId === room.hostUserId);
                return hostParticipant?.name || null;
              })(),
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

      const roomList = Array.from(rooms.values()).map((room) => {
        const hostParticipant = Array.from(room.participants.values()).find(p => p.userId === room.hostUserId);
        return {
          roomCode: room.roomCode,
          createdBy: room.createdBy,
          createdAt: room.createdAt,
          participantCount: room.participants.size,
          hostUserId: room.hostUserId,
          hostName: hostParticipant?.name || null,
          participants: Array.from(room.participants.values()),
        };
      });

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

      // Check if this user is the host
      const room = roomService.getRoom(roomCode);
      const isHost = room && room.hostUserId === userId;

      console.log(`[MeetingController] 🎫 Token for ${userName} (userId: ${userId})`);
      console.log(`[MeetingController] Room: ${roomCode}, Host: ${room?.hostUserId}, isHost: ${isHost}`);

      res.json({
        success: true,
        data: {
          ...tokenData,
          isHost,
        },
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

  /**
   * Notify that a participant has left
   * POST /api/meeting/participant-left
   * Used by frontend to cleanup room data when last participant leaves
   */
  async participantLeft(req, res) {
    try {
      const { roomCode, identity } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      if (!identity) {
        return res.status(400).json({
          success: false,
          message: 'Participant identity is required',
        });
      }

      // Remove participant from room
      const removed = roomService.removeParticipant(roomCode, identity);
      
      if (!removed) {
        console.log(`[MeetingController] Participant ${identity} not found in room ${roomCode}`);
      }

      // Check if room is now empty
      const room = roomService.getRoom(roomCode);
      const isEmpty = !room || room.participants.size === 0;

      if (isEmpty && room) {
        console.log(`[MeetingController] Room ${roomCode} is now empty - can cleanup client data`);
      }

      res.json({
        success: true,
        data: {
          roomCode,
          isEmpty,
          remainingParticipants: room ? room.participants.size : 0,
        },
      });
    } catch (error) {
      console.error('[MeetingController] Error handling participant left:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process participant leaving',
        error: error.message,
      });
    }
  }
}

// Export singleton instance
module.exports = new MeetingController();
