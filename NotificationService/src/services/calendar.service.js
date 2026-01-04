const { google } = require('googleapis');
const db = require('../config/db.config');

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Get auth URL for user
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId // Pass userId in state to identify user after callback
    });
  }

  // Handle OAuth callback
  async handleOAuthCallback(code, userId) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Save tokens to database
      await db.execute(
        `INSERT INTO user_calendar_tokens (user_id, access_token, refresh_token, expiry_date)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         expiry_date = VALUES(expiry_date)`,
        [userId, tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date)]
      );

      return tokens;
    } catch (error) {
      console.error('[CalendarService] OAuth callback error:', error);
      throw error;
    }
  }

  // Get user's OAuth client
  async getUserOAuthClient(userId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user_calendar_tokens WHERE user_id = ?',
        [userId]
      );

      if (rows.length === 0) {
        throw new Error('User has not authorized Google Calendar');
      }

      const { access_token, refresh_token, expiry_date } = rows[0];
      
      this.oauth2Client.setCredentials({
        access_token,
        refresh_token,
        expiry_date: new Date(expiry_date).getTime()
      });

      return this.oauth2Client;
    } catch (error) {
      console.error('[CalendarService] Get OAuth client error:', error);
      throw error;
    }
  }

  // Create calendar event
  async createEvent(userId, eventData) {
    try {
      const auth = await this.getUserOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: new Date(eventData.startTime).toISOString(),
          timeZone: 'Asia/Ho_Chi_Minh'
        },
        end: {
          dateTime: new Date(eventData.endTime).toISOString(),
          timeZone: 'Asia/Ho_Chi_Minh'
        },
        attendees: eventData.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 10 }       // 10 minutes before
          ]
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all' // Send email to attendees
      });

      console.log(`[CalendarService] Event created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('[CalendarService] Create event error:', error);
      throw error;
    }
  }

  // Update calendar event
  async updateEvent(userId, eventId, eventData) {
    try {
      const auth = await this.getUserOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: new Date(eventData.startTime).toISOString(),
          timeZone: 'Asia/Ho_Chi_Minh'
        },
        end: {
          dateTime: new Date(eventData.endTime).toISOString(),
          timeZone: 'Asia/Ho_Chi_Minh'
        }
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all'
      });

      return response.data;
    } catch (error) {
      console.error('[CalendarService] Update event error:', error);
      throw error;
    }
  }

  // Delete calendar event
  async deleteEvent(userId, eventId) {
    try {
      const auth = await this.getUserOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });

      console.log(`[CalendarService] Event deleted: ${eventId}`);
    } catch (error) {
      console.error('[CalendarService] Delete event error:', error);
      throw error;
    }
  }

  // Get user events
  async getUserEvents(userId, options = {}) {
    try {
      const auth = await this.getUserOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('[CalendarService] Get events error:', error);
      throw error;
    }
  }

  // Sync schedule to calendar
  async syncScheduleToCalendar(userId, scheduleId, classInfo) {
    try {
      const event = await this.createEvent(userId, {
        summary: classInfo.title || `Class: ${classInfo.subject}`,
        description: `Room: ${classInfo.room}\nTeacher: ${classInfo.teacherName}`,
        startTime: classInfo.startTime,
        endTime: classInfo.endTime,
        attendees: classInfo.attendees
      });

      // Save mapping in database
      await db.execute(
        `INSERT INTO schedule_calendar_mapping (schedule_id, user_id, calendar_event_id)
         VALUES (?, ?, ?)`,
        [scheduleId, userId, event.id]
      );

      return event;
    } catch (error) {
      console.error('[CalendarService] Sync schedule error:', error);
      throw error;
    }
  }
}

module.exports = new CalendarService();
