const { randomUUID } = require('crypto');
const pool = require('../db/pool');

/**
 * Message Service - Quản lý chat messages trong phòng
 * CHỨC NĂNG: 
 * - Tạo message mới
 * - Lấy danh sách message theo room
 * - Xóa message cũ (cleanup)
 */
class MessageService {
  /**
   * Tạo message mới
   * @param {string} roomId - UUID của phòng
   * @param {string} senderUserId - UUID của người gửi (nullable)
   * @param {string} senderName - Tên hiển thị
   * @param {string} content - Nội dung message
   * @param {string} messageType - Loại message (text, system, etc)
   */
  async createMessage(roomId, senderUserId, senderName, content, messageType = 'text') {
    const messageId = randomUUID();

    await pool.execute(
      `INSERT INTO room_messages (id, room_id, sender_user_id, sender_name, message_type, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [messageId, roomId, senderUserId || null, senderName, messageType, content]
    );

    // Trả về message vừa tạo
    return {
      id: messageId,
      roomId,
      senderUserId,
      senderName,
      messageType,
      content,
      createdAt: new Date(),
    };
  }

  /**
   * Lấy danh sách message của phòng (sort theo thời gian tăng dần)
   * @param {string} roomCode - Mã phòng
   * @param {number} limit - Số lượng message tối đa (default 100)
   */
  async getMessages(roomCode, limit = 100) {
    const [rows] = await pool.execute(
      `SELECT m.id, m.room_id, m.sender_user_id, m.sender_name, m.message_type, m.content, m.created_at
       FROM room_messages m
       INNER JOIN rooms r ON m.room_id = r.id
       WHERE r.room_code = ?
       ORDER BY m.created_at ASC
       LIMIT ?`,
      [roomCode, limit]
    );

    return rows.map(row => ({
      id: row.id,
      roomId: row.room_id,
      senderUserId: row.sender_user_id,
      senderName: row.sender_name,
      messageType: row.message_type,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  /**
   * Xóa message cũ của các phòng đã ended quá N ngày
   * @param {number} daysOld - Số ngày (messages của phòng ended trước đó sẽ bị xóa)
   * @returns {number} Số lượng message đã xóa
   */
  async cleanupOldMessages(daysOld = 14) {
    const [result] = await pool.execute(
      `DELETE m FROM room_messages m
       INNER JOIN rooms r ON m.room_id = r.id
       WHERE r.status = 'ended'
         AND r.ended_at IS NOT NULL
         AND TIMESTAMPDIFF(DAY, r.ended_at, NOW()) > ?`,
      [daysOld]
    );

    return result.affectedRows || 0;
  }

  /**
   * Xóa TẤT CẢ message của 1 phòng cụ thể
   * @param {string} roomId - UUID của phòng
   */
  async deleteMessagesByRoom(roomId) {
    const [result] = await pool.execute(
      'DELETE FROM room_messages WHERE room_id = ?',
      [roomId]
    );

    return result.affectedRows || 0;
  }
}

module.exports = new MessageService();
