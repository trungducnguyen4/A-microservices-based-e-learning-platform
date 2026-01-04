const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');

// Create calendar event
router.post('/events', calendarController.createEvent);

// Update calendar event
router.put('/events/:eventId', calendarController.updateEvent);

// Delete calendar event
router.delete('/events/:eventId', calendarController.deleteEvent);

// Get user events
router.get('/events/user/:userId', calendarController.getUserEvents);

// Sync schedule to calendar
router.post('/sync/schedule', calendarController.syncSchedule);

// Get OAuth URL
router.get('/auth/url', calendarController.getAuthUrl);

// Handle OAuth callback
router.post('/auth/callback', calendarController.handleCallback);

module.exports = router;
