/**
 * API Configuration - Centralized API endpoint management
 * 
 * FLOW:
 * - Development: Client (5173) -> Vite Proxy (/api) -> API Gateway (8888) -> Services
 * - Production:  Client -> Nginx (/api) -> API Gateway (8888) -> Services
 * 
 * Tất cả requests đều đi qua API Gateway, client chỉ cần biết path /api/*
 * API Gateway sẽ route đến đúng service dựa trên path prefix
 */

// =============================================================================
// CORE API CONFIGURATION
// =============================================================================

/**
 * Get the base API URL
 * - In development: Uses Vite proxy (relative path /api)
 * - In production: Uses VITE_API_BASE from env or defaults to /api (Nginx handles)
 * 
 * IMPORTANT: Luôn sử dụng relative path /api để:
 * - Vite proxy xử lý khi dev (localhost:5173 -> localhost:8888)
 * - Nginx xử lý khi production (academihub.site/api -> api-gateway:8888)
 */
export const getApiBase = (): string => {
  // Luôn ưu tiên VITE_API_BASE nếu có, ngược lại dùng /api (relative)
  // Điều này đảm bảo hoạt động trên mọi môi trường
  return import.meta.env.VITE_API_BASE || '/api';
};

// API Base URL - Sử dụng trong toàn bộ app
export const API_BASE = getApiBase();

// =============================================================================
// SERVICE ENDPOINTS - All routed through API Gateway
// =============================================================================

/**
 * API Gateway routes (from application.yml):
 * - /api/users/**     -> UserService (8080)
 * - /api/homework/**  -> HomeworkService (8081)
 * - /api/submission/**-> HomeworkService (8081)
 * - /api/schedules/** -> ScheduleService (8082)
 * - /api/admin/**     -> AdminService (8084)
 * - /api/announcements/** -> AnnouncementService (8090)
 * - /api/classrooms/** -> ClassroomService (4000) - StripPrefix=2
 * - /api/files/**     -> FileService (5000) - StripPrefix=2
 */

export const API_ENDPOINTS = {
  // User Service
  USER: {
    BASE: `${API_BASE}/users`,
    AUTH: {
      LOGIN: `${API_BASE}/users/auth/login`,
      REGISTER: `${API_BASE}/users/auth/register`,
      LOGOUT: `${API_BASE}/users/auth/logout`,
      REFRESH: `${API_BASE}/users/auth/refresh`,
    },
    PROFILE: `${API_BASE}/users/profile`,
  },

  // Homework Service
  HOMEWORK: {
    BASE: `${API_BASE}/homework`,
  },

  // Submission (part of Homework Service)
  SUBMISSION: {
    BASE: `${API_BASE}/submission`,
  },

  // Schedule Service
  SCHEDULE: {
    BASE: `${API_BASE}/schedules`,
  },

  // Admin Service
  ADMIN: {
    BASE: `${API_BASE}/admin`,
  },

  // Announcement Service
  ANNOUNCEMENT: {
    BASE: `${API_BASE}/announcements`,
  },

  // Classroom Service 
  // ClassroomService routes:
  // - /api/meeting/*, /api/transcript/* (prefixed with /api)
  // - /getToken, /health, /rooms/* (NOT prefixed with /api)
  // Gateway routing:
  // - /api/classrooms/meeting/*   -> /api/meeting/*
  // - /api/classrooms/transcript/*-> /api/transcript/*
  // - /api/classrooms/getToken    -> /getToken
  CLASSROOM: {
    BASE: `${API_BASE}/classrooms`,
    // Full paths as seen by client (Gateway handles routing)
    GET_TOKEN: `${API_BASE}/classrooms/getToken`,
    HEALTH: `${API_BASE}/classrooms/health`,
    MEETING: {
      CHECK: (roomCode: string) => `${API_BASE}/classrooms/meeting/check/${roomCode}`,
      CREATE: `${API_BASE}/classrooms/meeting/create`,
      END: (roomCode: string) => `${API_BASE}/classrooms/meeting/end/${roomCode}`,
      MESSAGE: `${API_BASE}/classrooms/meeting/message`,
      MESSAGES: (roomCode: string) => `${API_BASE}/classrooms/meeting/messages/${roomCode}`,
      PARTICIPANT_LEFT: `${API_BASE}/classrooms/meeting/participant-left`,
      KICK_PARTICIPANT: `${API_BASE}/classrooms/meeting/kick-participant`,
    },
    TRANSCRIPT: {
      SAVE: `${API_BASE}/classrooms/transcript/save`,
      SAVE_BATCH: `${API_BASE}/classrooms/transcript/save-batch`,
      GET: (roomCode: string) => `${API_BASE}/classrooms/transcript/${roomCode}`,
    },
    ROOM: (roomName: string) => `${API_BASE}/classrooms/rooms/${roomName}`,
  },

  // File Service (Gateway strips /api/files prefix)
  FILE: {
    BASE: `${API_BASE}/files`,
    UPLOAD: `${API_BASE}/files/upload`,
    DOWNLOAD: (fileId: string) => `${API_BASE}/files/file/${fileId}`,
  },
} as const;

// =============================================================================
// AXIOS DEFAULTS
// =============================================================================

export const AXIOS_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Create authorization header
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Log API configuration (for debugging)
 */
export const logApiConfig = (): void => {
  if (isDevelopment()) {
    console.log('[API Config]', {
      API_BASE,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });
  }
};

export default API_ENDPOINTS;
