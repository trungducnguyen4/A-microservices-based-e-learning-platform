/**
 * Google Calendar Integration Utility
 * 
 * This module provides client-side Google Calendar API integration using the Google Identity Services (GIS).
 * It handles OAuth2 authentication and batch event creation for course schedules.
 * 
 * Setup Requirements:
 * 1. Create a project in Google Cloud Console: https://console.cloud.google.com/
 * 2. Enable Google Calendar API
 * 3. Create OAuth 2.0 Client ID (Web application)
 * 4. Add authorized JavaScript origins (e.g., http://localhost:5173, http://localhost:8083)
 * 5. Add the Client ID to your environment variables or config
 */

// Google API configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const CALENDAR_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// Type definitions for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiInited = false;
let gisInited = false;
let tokenClient: any = null;

/**
 * Load the Google API client library (gapi)
 */
export const initGoogleAPI = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    // Load gapi script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [CALENDAR_DISCOVERY_DOC],
          });
          gapiInited = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Load Google Identity Services (GIS) for OAuth
 */
export const initGoogleIdentity = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gisInited) {
      resolve();
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.'));
      return;
    }

    // Load GIS script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set per-request
      });
      gisInited = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Request access token from user
 */
const getAccessToken = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if token already exists
      const existingToken = window.gapi?.client?.getToken();
      if (existingToken) {
        resolve(existingToken.access_token);
        return;
      }

      // Request new token
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
          return;
        }
        resolve(resp.access_token);
      };

      // Trigger OAuth flow
      if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format date to RFC3339 for Google Calendar API
 */
const toRFC3339 = (date: Date): string => {
  return date.toISOString();
};

/**
 * Create a single event in Google Calendar
 */
const createEvent = async (event: {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}): Promise<any> => {
  const calendarEvent = {
    summary: event.summary,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: toRFC3339(event.start),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: toRFC3339(event.end),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  return window.gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: calendarEvent,
  });
};

/**
 * Batch create multiple events in Google Calendar
 */
export const syncScheduleToGoogleCalendar = async (
  sessions: Array<{
    topic: string;
    dt: Date;
    instructor?: string;
    room?: string;
    duration?: number; // in minutes, default 90
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number; errors: any[] }> => {
  // Initialize APIs
  await initGoogleAPI();
  await initGoogleIdentity();

  // Get access token (triggers OAuth if needed)
  const token = await getAccessToken();
  window.gapi.client.setToken({ access_token: token });

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  // Batch create events (Google API supports batch, but for simplicity we'll do sequential with progress)
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const start = new Date(session.dt);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (session.duration || 90));

    const description = [
      session.instructor ? `Giảng viên: ${session.instructor}` : '',
      session.room ? `Phòng học: ${session.room}` : '',
    ].filter(Boolean).join('\n');

    try {
      await createEvent({
        summary: session.topic || 'Buổi học',
        description,
        location: session.room || '',
        start,
        end,
      });
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ session, error });
      console.error('Failed to create event:', error);
    }

    if (onProgress) {
      onProgress(i + 1, sessions.length);
    }
  }

  return results;
};

/**
 * Check if user has granted calendar permissions
 */
export const hasCalendarPermission = (): boolean => {
  return window.gapi?.client?.getToken() !== null;
};

/**
 * Revoke calendar access
 */
export const revokeCalendarAccess = () => {
  const token = window.gapi?.client?.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      window.gapi.client.setToken(null);
    });
  }
};
