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
        hostUserId: createdBy, // userId của người tạo phòng là host
        participants: new Map()
      });
      console.log(`[RoomStore] ✅ Room ${roomCode} created. Host userId: ${createdBy}`);
    } else {
      console.log(`[RoomStore] Room ${roomCode} already exists. Host: ${this.rooms.get(roomCode).hostUserId}`);
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
      const creatorId = participant.userId || participant.identity;
      console.log(`[RoomStore] Auto-creating room ${roomCode}. Creator: ${participant.name} (userId: ${creatorId})`);
      room = this.createRoom(roomCode, creatorId);
    }

    // Check if this user is the host
    const isHost = room.hostUserId && room.hostUserId === participant.userId;

    // Add hoặc update participant
    room.participants.set(participant.identity, {
      identity: participant.identity,
      name: participant.name,
      userId: participant.userId,
      joinedAt: participant.joinedAt || new Date(),
      isHost: isHost
    });

    console.log(`[RoomStore] 👥 Added ${participant.name} to ${roomCode}. ${isHost ? '🎭 HOST' : '👤 Guest'} (hostUserId: ${room.hostUserId}, userId: ${participant.userId})`);
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

    const participant = room.participants.get(identity);
    const deleted = room.participants.delete(identity);
    if (deleted) {
      console.log(`[RoomStore] Participant ${identity} removed from room ${roomCode}`);
      
      // Nếu host rời phòng, chuyển host cho người khác
      if (participant && room.hostUserId === participant.userId && room.participants.size > 0) {
        const nextParticipant = room.participants.values().next().value;
        if (nextParticipant) {
          room.hostUserId = nextParticipant.userId;
          nextParticipant.isHost = true;
          console.log(`[RoomStore] 🔄 Host transferred to ${nextParticipant.name} (userId: ${nextParticipant.userId})`);
        }
      }
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
