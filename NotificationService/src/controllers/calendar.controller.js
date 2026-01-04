const calendarService = require('../services/calendar.service');

class CalendarController {
  // Create calendar event
  async createEvent(req, res) {
    try {
      const { userId, summary, description, startTime, endTime, attendees } = req.body;

      if (!userId || !summary || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const event = await calendarService.createEvent(userId, {
        summary,
        description,
        startTime,
        endTime,
        attendees
      });

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('[CalendarController] Create event error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create calendar event'
      });
    }
  }

  // Update calendar event
  async updateEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { userId, summary, description, startTime, endTime } = req.body;

      const event = await calendarService.updateEvent(userId, eventId, {
        summary,
        description,
        startTime,
        endTime
      });

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('[CalendarController] Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update calendar event'
      });
    }
  }

  // Delete calendar event
  async deleteEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { userId } = req.query;

      await calendarService.deleteEvent(userId, eventId);

      res.json({
        success: true,
        message: 'Calendar event deleted'
      });
    } catch (error) {
      console.error('[CalendarController] Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete calendar event'
      });
    }
  }

  // Get user events
  async getUserEvents(req, res) {
    try {
      const { userId } = req.params;
      const { timeMin, timeMax } = req.query;

      const events = await calendarService.getUserEvents(userId, {
        timeMin,
        timeMax
      });

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('[CalendarController] Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get calendar events'
      });
    }
  }

  // Sync schedule to calendar
  async syncSchedule(req, res) {
    try {
      const { userId, scheduleId, classInfo } = req.body;

      const event = await calendarService.syncScheduleToCalendar(
        userId,
        scheduleId,
        classInfo
      );

      res.json({
        success: true,
        message: 'Schedule synced to calendar',
        data: event
      });
    } catch (error) {
      console.error('[CalendarController] Sync schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync schedule'
      });
    }
  }

  // Get OAuth URL
  async getAuthUrl(req, res) {
    try {
      const { userId } = req.query;
      const authUrl = calendarService.getAuthUrl(userId);

      res.json({
        success: true,
        data: { authUrl }
      });
    } catch (error) {
      console.error('[CalendarController] Get auth URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get auth URL'
      });
    }
  }

  // Handle OAuth callback
  async handleCallback(req, res) {
    try {
      const { code, userId } = req.body;

      await calendarService.handleOAuthCallback(code, userId);

      res.json({
        success: true,
        message: 'Google Calendar authorized successfully'
      });
    } catch (error) {
      console.error('[CalendarController] OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to authorize Google Calendar'
      });
    }
  }
}

module.exports = new CalendarController();
