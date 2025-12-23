/**
 * Room Persistence Utility
 * Lưu trữ dữ liệu room trong localStorage để persist khi user rời phòng nhưng phòng vẫn còn người
 */

export interface RoomData {
  roomCode: string;
  totalUsedTime: number; // Tổng thời gian transcription đã dùng (ms)
  transcript: Array<{
    id: string;
    text: string;
    timestamp: string;
  }>;
  lastUpdated: number; // Timestamp
}

export interface RoomSession {
  roomCode: string;
  userName: string;
  userId?: string;
  joinedAt: number;
  hasJoined: boolean; // Flag để biết user đã join room này chưa
}

const STORAGE_PREFIX = 'classroom_room_';
const SESSION_PREFIX = 'room_session_';
const DATA_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours - session hết hạn sau 2h

/**
 * Get room data from localStorage
 */
export const getRoomData = (roomCode: string): RoomData | null => {
  try {
    const key = `${STORAGE_PREFIX}${roomCode}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return null;
    }

    const parsed: RoomData = JSON.parse(data);
    
    // Check if data is expired (24 hours old)
    if (Date.now() - parsed.lastUpdated > DATA_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[RoomPersistence] Error getting room data:', error);
    return null;
  }
};

/**
 * Save room data to localStorage
 */
export const saveRoomData = (data: Omit<RoomData, 'lastUpdated'>): void => {
  try {
    const key = `${STORAGE_PREFIX}${data.roomCode}`;
    const roomData: RoomData = {
      ...data,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(key, JSON.stringify(roomData));
  } catch (error) {
    console.error('[RoomPersistence] Error saving room data:', error);
  }
};

/**
 * Update specific fields of room data
 */
export const updateRoomData = (
  roomCode: string,
  updates: Partial<Omit<RoomData, 'roomCode' | 'lastUpdated'>>
): void => {
  const existingData = getRoomData(roomCode);
  
  const data: RoomData = {
    roomCode,
    totalUsedTime: updates.totalUsedTime ?? existingData?.totalUsedTime ?? 0,
    transcript: updates.transcript ?? existingData?.transcript ?? [],
    lastUpdated: Date.now(),
  };

  saveRoomData(data);
};

/**
 * Clear room data from localStorage
 * Gọi khi room đóng hẳn (không còn ai)
 */
export const clearRoomData = (roomCode: string): void => {
  try {
    const key = `${STORAGE_PREFIX}${roomCode}`;
    localStorage.removeItem(key);
    console.log(`[RoomPersistence] Cleared data for room: ${roomCode}`);
  } catch (error) {
    console.error('[RoomPersistence] Error clearing room data:', error);
  }
};

/**
 * Initialize room data if not exists
 */
export const initializeRoomData = (roomCode: string): RoomData => {
  let data = getRoomData(roomCode);
  
  if (!data) {
    data = {
      roomCode,
      totalUsedTime: 0,
      transcript: [],
      lastUpdated: Date.now(),
    };
    saveRoomData(data);
  }

  return data;
};

/**
 * Clean up old room data (> 24 hours)
 */
export const cleanupOldRoomData = (): void => {
  try {
    // Cleanup localStorage (room data)
    const localKeys = Object.keys(localStorage);
    let cleaned = 0;

    for (const key of localKeys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed: RoomData = JSON.parse(data);
          if (Date.now() - parsed.lastUpdated > DATA_EXPIRY) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }
    }
    
    // Cleanup sessionStorage (session data)
    const sessionKeys = Object.keys(sessionStorage);
    for (const key of sessionKeys) {
      // Cleanup old sessions from sessionStorage
      if (key.startsWith(SESSION_PREFIX)) {
        const data = sessionStorage.getItem(key);
        if (data) {
          const parsed: RoomSession = JSON.parse(data);
          if (Date.now() - parsed.joinedAt > SESSION_EXPIRY) {
            sessionStorage.removeItem(key);
            cleaned++;
          }
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[RoomPersistence] Cleaned up ${cleaned} old room(s)/session(s)`);
    }
  } catch (error) {
    console.error('[RoomPersistence] Error cleaning up old data:', error);
  }
};

/**
 * Save room session (when user joins)
 * Dùng sessionStorage → Tự động xóa khi đóng browser/tab
 */
export const saveRoomSession = (roomCode: string, userName: string, userId?: string): void => {
  try {
    const key = `${SESSION_PREFIX}${roomCode}`;
    const session: RoomSession = {
      roomCode,
      userName,
      userId,
      joinedAt: Date.now(),
      hasJoined: false, // Chưa thực sự join, chỉ vào PreJoin
    };
    
    sessionStorage.setItem(key, JSON.stringify(session));
    console.log(`[RoomPersistence] 💾 Saved session (sessionStorage) for room: ${roomCode}`);
  } catch (error) {
    console.error('[RoomPersistence] Error saving session:', error);
  }
};

/**
 * Get room session
 * Đọc từ sessionStorage → Tự động mất khi đóng browser
 */
export const getRoomSession = (roomCode: string): RoomSession | null => {
  try {
    const key = `${SESSION_PREFIX}${roomCode}`;
    const data = sessionStorage.getItem(key);
    
    if (!data) {
      return null;
    }

    const session: RoomSession = JSON.parse(data);
    
    // Check if session is expired (2 hours)
    if (Date.now() - session.joinedAt > SESSION_EXPIRY) {
      sessionStorage.removeItem(key);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[RoomPersistence] Error getting session:', error);
    return null;
  }
};

/**
 * Mark that user has successfully joined a room
 * Update trong sessionStorage
 */
export const markRoomAsJoined = (roomCode: string): void => {
  try {
    const key = `${SESSION_PREFIX}${roomCode}`;
    const data = sessionStorage.getItem(key);
    
    if (data) {
      const session: RoomSession = JSON.parse(data);
      session.hasJoined = true;
      sessionStorage.setItem(key, JSON.stringify(session));
      console.log(`[RoomPersistence] ✅ Marked room ${roomCode} as joined (sessionStorage)`);
    } else {
      console.warn(`[RoomPersistence] No session found for room ${roomCode}, creating new one`);
      const session: RoomSession = {
        roomCode,
        userName: 'Unknown',
        joinedAt: Date.now(),
        hasJoined: true,
      };
      sessionStorage.setItem(key, JSON.stringify(session));
    }
  } catch (error) {
    console.error('[RoomPersistence] Error marking room as joined:', error);
  }
};

/**
 * Check if user has already joined this room before
 */
export const hasJoinedRoom = (roomCode: string): boolean => {
  const session = getRoomSession(roomCode);
  return session?.hasJoined || false;
};

/**
 * Clear room session
 * Xóa khỏi sessionStorage
 */
export const clearRoomSession = (roomCode: string): void => {
  try {
    const key = `${SESSION_PREFIX}${roomCode}`;
    sessionStorage.removeItem(key);
    console.log(`[RoomPersistence] 🗑️ Cleared session (sessionStorage) for room: ${roomCode}`);
  } catch (error) {
    console.error('[RoomPersistence] Error clearing session:', error);
  }
};
