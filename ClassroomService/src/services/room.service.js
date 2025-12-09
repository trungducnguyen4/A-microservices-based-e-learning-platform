/**
 * In-memory store để track active rooms
 * Format: { roomCode: { createdAt, createdBy, participants: Map } }
 */
class RoomStore {
  constructor() {
    this.rooms = new Map();
  }

  /**
   * Tạo room mới
   */
  createRoom(roomCode, createdBy) {
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, {
        roomCode: roomCode,
        createdAt: new Date(),
        createdBy: createdBy,
        participants: new Map()
      });
      console.log(`[RoomStore] Room ${roomCode} created by ${createdBy}`);
    }
    return this.rooms.get(roomCode);
  }

  /**
   * Lấy thông tin room
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  /**
   * Check room có tồn tại không
   */
  hasRoom(roomCode) {
    return this.rooms.has(roomCode);
  }

  /**
   * Thêm participant vào room
   * Tự động tạo room nếu chưa tồn tại
   */
  addParticipant(roomCode, participant) {
    let room = this.rooms.get(roomCode);
    
    // Tự động tạo room nếu chưa tồn tại
    if (!room) {
      console.log(`[RoomStore] Auto-creating room ${roomCode} for participant ${participant.identity}`);
      room = this.createRoom(roomCode, participant.identity);
    }

    // Add hoặc update participant
    room.participants.set(participant.identity, {
      identity: participant.identity,
      name: participant.name,
      joinedAt: participant.joinedAt || new Date()
    });

    console.log(`[RoomStore] Participant ${participant.name} added to room ${roomCode}`);
    return true;
  }

  /**
   * Xóa participant khỏi room
   */
  removeParticipant(roomCode, identity) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return false;
    }

    const deleted = room.participants.delete(identity);
    if (deleted) {
      console.log(`[RoomStore] Participant ${identity} removed from room ${roomCode}`);
    }
    return deleted;
  }

  /**
   * Xóa room
   */
  deleteRoom(roomCode) {
    const deleted = this.rooms.delete(roomCode);
    if (deleted) {
      console.log(`[RoomStore] Room ${roomCode} deleted`);
    }
    return deleted;
  }

  /**
   * Lấy tất cả rooms
   */
  getAllRooms() {
    return this.rooms;
  }

  /**
   * Cleanup rooms cũ (gọi định kỳ)
   */
  cleanupOldRooms(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [roomCode, roomData] of this.rooms.entries()) {
      // Xóa rooms cũ hơn maxAge và không có participants
      if (now - roomData.createdAt.getTime() > maxAge && roomData.participants.size === 0) {
        this.rooms.delete(roomCode);
        cleanedCount++;
        console.log(`[RoomStore] Cleaned up inactive room: ${roomCode}`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`[RoomStore] Cleaned up ${cleanedCount} inactive rooms`);
    }
    
    return cleanedCount;
  }
}

// Singleton instance
const roomStore = new RoomStore();

module.exports = roomStore;
