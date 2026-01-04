const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// Send notification
router.post('/send', notificationController.sendNotification);

// Get user notifications
router.get('/user/:userId', notificationController.getUserNotifications);

// Mark as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Send email
router.post('/email', notificationController.sendEmail);

// Send homework reminder
router.post('/homework/reminder', notificationController.sendHomeworkReminder);

// Send class reminder
router.post('/class/reminder', notificationController.sendClassReminder);

// Bulk notifications
router.post('/bulk', notificationController.sendBulkNotifications);

module.exports = router;
