const emailService = require('../services/email.service');
const queueManager = require('../services/queue.service');
const db = require('../config/db.config');

class NotificationController {
  // Send notification
  async sendNotification(req, res) {
    try {
      const { userId, type, title, message, metadata } = req.body;

      if (!userId || !type || !message) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Save to database
      const [result] = await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, type, title, message, JSON.stringify(metadata || {})]
      );

      res.json({
        success: true,
        data: {
          notificationId: result.insertId,
          userId,
          type,
          title,
          message
        }
      });
    } catch (error) {
      console.error('[NotificationController] Send error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification'
      });
    }
  }

  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const [notifications] = await db.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), parseInt(offset)]
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('[NotificationController] Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }

  // Mark as read
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      await db.execute(
        `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?`,
        [notificationId]
      );

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('[NotificationController] Mark read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark as read'
      });
    }
  }

  // Send email
  async sendEmail(req, res) {
    try {
      const { to, subject, template, data } = req.body;

      if (!to || !subject || !template) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Add to email queue
      await queueManager.addToQueue('email', {
        to,
        subject,
        template,
        data
      });

      res.json({
        success: true,
        message: 'Email queued for sending'
      });
    } catch (error) {
      console.error('[NotificationController] Send email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
    }
  }

  // Send homework reminder
  async sendHomeworkReminder(req, res) {
    try {
      const { homeworkId, studentIds } = req.body;

      // Add to queue
      await queueManager.addToQueue('email', {
        type: 'homework_reminder',
        homeworkId,
        studentIds
      });

      res.json({
        success: true,
        message: 'Homework reminder queued'
      });
    } catch (error) {
      console.error('[NotificationController] Homework reminder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send homework reminder'
      });
    }
  }

  // Send class reminder
  async sendClassReminder(req, res) {
    try {
      const { scheduleId, participantIds, minutesBefore = 10 } = req.body;

      // Add to queue
      await queueManager.addToQueue('email', {
        type: 'class_reminder',
        scheduleId,
        participantIds,
        minutesBefore
      });

      res.json({
        success: true,
        message: 'Class reminder queued'
      });
    } catch (error) {
      console.error('[NotificationController] Class reminder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send class reminder'
      });
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(req, res) {
    try {
      const { userIds, type, title, message } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid userIds'
        });
      }

      const values = userIds.map(userId => [userId, type, title, message]);
      
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES ?`,
        [values.map(v => [...v, new Date()])]
      );

      res.json({
        success: true,
        message: `Sent ${userIds.length} notifications`
      });
    } catch (error) {
      console.error('[NotificationController] Bulk send error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notifications'
      });
    }
  }
}

module.exports = new NotificationController();
