/**
 * Meeting Service
 * Xử lý các API calls liên quan đến meeting/classroom
 */

import { classroomService } from './classroomApi';

export interface RoomCheckResponse {
  exists: boolean;
  room?: string;
}

/**
 * Kiểm tra xem room có tồn tại không
 * @param roomCode - Mã phòng cần kiểm tra
 * @returns Promise với thông tin room exists
 */
export const checkRoomExists = async (roomCode: string): Promise<RoomCheckResponse> => {
  try {
    // Use classroomService which goes through API Gateway
    const data = await classroomService.checkRoom(roomCode);
    return data;
  } catch (error) {
    console.error('[MeetingService] Error checking room:', error);
    throw new Error('Unable to verify meeting room');
  }
};

/**
 * Validate room code format
 * @param roomCode - Mã phòng cần validate
 * @returns true nếu format đúng
 */
export const validateRoomCodeFormat = (roomCode: string): boolean => {
  const roomCodePattern = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/;
  return roomCodePattern.test(roomCode);
};

/**
 * Clean và format room code
 * @param roomCode - Mã phòng cần clean
 * @returns Mã phòng đã được format
 */
export const cleanRoomCode = (roomCode: string): string => {
  return roomCode.trim().toUpperCase().replace(/\s+/g, '');
};
