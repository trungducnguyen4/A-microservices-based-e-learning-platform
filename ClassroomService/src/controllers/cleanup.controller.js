const messageService = require('../services/message.service');
const pool = require('../db/pool');

/**
 * Cleanup Controller - API admin để dọn dẹp dữ liệu cũ
 * CHỨC NĂNG:
 * - Xóa messages của phòng đã ended quá N ngày
 * - Xóa events của phòng đã ended quá N ngày
 * - Lấy thống kê storage
 */
class CleanupController {
  /**
   * Xóa messages cũ
   * POST /api/admin/cleanup/messages
   * Body: { daysOld: 14 }
   */
  async cleanupMessages(req, res) {
    try {
      const { daysOld } = req.body;
      const days = parseInt(daysOld || '14', 10);

      const deletedCount = await messageService.cleanupOldMessages(days);

      console.log(`[CleanupController] Cleaned up ${deletedCount} old messages (>${days} days)`);

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} messages from rooms ended more than ${days} days ago`,
        data: {
          deletedCount,
          daysOld: days,
        },
      });
    } catch (error) {
      console.error('[CleanupController] Error cleaning up messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup messages',
        error: error.message,
      });
    }
  }

  /**
   * Xóa events cũ
   * POST /api/admin/cleanup/events
   * Body: { daysOld: 14 }
   */
  async cleanupEvents(req, res) {
    try {
      const { daysOld } = req.body;
      const days = parseInt(daysOld || '14', 10);

      const [result] = await pool.execute(
        `DELETE e FROM room_events e
         INNER JOIN rooms r ON e.room_id = r.id
         WHERE r.status = 'ended'
           AND r.ended_at IS NOT NULL
           AND TIMESTAMPDIFF(DAY, r.ended_at, NOW()) > ?`,
        [days]
      );

      const deletedCount = result.affectedRows || 0;

      console.log(`[CleanupController] Cleaned up ${deletedCount} old events (>${days} days)`);

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} events from rooms ended more than ${days} days ago`,
        data: {
          deletedCount,
          daysOld: days,
        },
      });
    } catch (error) {
      console.error('[CleanupController] Error cleaning up events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup events',
        error: error.message,
      });
    }
  }

  /**
   * Cleanup ALL (messages + events của phòng cũ)
   * POST /api/admin/cleanup/all
   * Body: { daysOld: 14 }
   */
  async cleanupAll(req, res) {
    try {
      const { daysOld } = req.body;
      const days = parseInt(daysOld || '14', 10);

      // Cleanup messages
      const messagesDeleted = await messageService.cleanupOldMessages(days);

      // Cleanup events
      const [eventsResult] = await pool.execute(
        `DELETE e FROM room_events e
         INNER JOIN rooms r ON e.room_id = r.id
         WHERE r.status = 'ended'
           AND r.ended_at IS NOT NULL
           AND TIMESTAMPDIFF(DAY, r.ended_at, NOW()) > ?`,
        [days]
      );

      const eventsDeleted = eventsResult.affectedRows || 0;

      console.log(`[CleanupController] Full cleanup: ${messagesDeleted} messages, ${eventsDeleted} events (>${days} days)`);

      res.json({
        success: true,
        message: `Cleaned up ${messagesDeleted} messages and ${eventsDeleted} events from rooms ended more than ${days} days ago`,
        data: {
          messagesDeleted,
          eventsDeleted,
          totalDeleted: messagesDeleted + eventsDeleted,
          daysOld: days,
        },
      });
    } catch (error) {
      console.error('[CleanupController] Error in full cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform cleanup',
        error: error.message,
      });
    }
  }

  /**
   * Lấy thống kê storage
   * GET /api/admin/stats
   */
  async getStats(req, res) {
    try {
      // Count rooms
      const [roomsCount] = await pool.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status = "ended" THEN 1 ELSE 0 END) as ended FROM rooms'
      );

      // Count messages
      const [messagesCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM room_messages'
      );

      // Count events
      const [eventsCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM room_events'
      );

      // Count participants
      const [participantsCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM room_participants'
      );

      res.json({
        success: true,
        data: {
          rooms: roomsCount[0],
          messages: messagesCount[0].total,
          events: eventsCount[0].total,
          participants: participantsCount[0].total,
        },
      });
    } catch (error) {
      console.error('[CleanupController] Error getting stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: error.message,
      });
    }
  }
}

module.exports = new CleanupController();
