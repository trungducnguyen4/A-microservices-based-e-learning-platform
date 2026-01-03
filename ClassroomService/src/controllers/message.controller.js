const messageService = require('../services/message.service');
const roomService = require('../services/room.service');

/**
 * Message Controller - Xử lý API cho chat messages
 */
class MessageController {
  /**
   * Gửi message mới
   * POST /api/meeting/message
   * Body: { roomCode, senderUserId?, senderName, content, messageType? }
   */
  async sendMessage(req, res) {
    try {
      const { roomCode, senderUserId, senderName, content, messageType } = req.body;

      // Validate
      if (!roomCode || !senderName || !content) {
        return res.status(400).json({
          success: false,
          message: 'roomCode, senderName, and content are required',
        });
      }

      // Kiểm tra phòng tồn tại
      const room = await roomService.getRoom(roomCode);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }

      // Tạo message
      const message = await messageService.createMessage(
        room.id,
        senderUserId,
        senderName,
        content,
        messageType || 'text'
      );

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error) {
      console.error('[MessageController] Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  /**
   * Lấy danh sách message của phòng
   * GET /api/meeting/messages/:roomCode?limit=100
   */
  async getMessages(req, res) {
    try {
      const { roomCode } = req.params;
      const limit = parseInt(req.query.limit || '100', 10);

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'roomCode is required',
        });
      }

      // Kiểm tra phòng tồn tại
      const room = await roomService.getRoom(roomCode);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }

      const messages = await messageService.getMessages(roomCode, limit);

      res.json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      console.error('[MessageController] Error getting messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get messages',
        error: error.message,
      });
    }
  }
}

module.exports = new MessageController();
