const { randomUUID } = require('crypto');
const pool = require('../db/pool');

const ROOM_STATUS_ACTIVE = 'active';

function mapRoomRow(roomRow) {
  return {
    id: roomRow.id,
    roomCode: roomRow.room_code,
    createdAt: roomRow.created_at,
    createdBy: roomRow.created_by,
    hostUserId: roomRow.host_user_id,
    status: roomRow.status,
    participants: new Map(),
  };
}

function mapParticipantRow(row) {
  return {
    identity: row.identity,
    name: row.display_name,
    userId: row.user_id,
    joinedAt: row.joined_at,
    isHost: Boolean(row.is_host),
  };
}

class RoomService {
  async _getRoomRowByCode(roomCode) {
    const [rows] = await pool.execute(
      'SELECT * FROM rooms WHERE room_code = ? LIMIT 1',
      [roomCode]
    );
    return rows[0] || null;
  }

  async _insertEvent(roomId, eventType, actorUserId = null, payload = null) {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO room_events (id, room_id, event_type, actor_user_id, payload) VALUES (?, ?, ?, ?, ?)',
      [id, roomId, eventType, actorUserId, payload ? JSON.stringify(payload) : null]
    );
  }

  async createRoom(roomCode, createdBy) {
    const existing = await this._getRoomRowByCode(roomCode);
    if (existing) {
      return this.getRoom(roomCode);
    }

    const roomId = randomUUID();

    await pool.execute(
      'INSERT INTO rooms (id, room_code, created_by, host_user_id, status) VALUES (?, ?, ?, ?, ?)',
      [roomId, roomCode, createdBy, createdBy, ROOM_STATUS_ACTIVE]
    );

    await this._insertEvent(roomId, 'ROOM_CREATED', createdBy, { roomCode });

    return this.getRoom(roomCode);
  }

  async getRoom(roomCode) {
    const roomRow = await this._getRoomRowByCode(roomCode);
    if (!roomRow) return null;

    const room = mapRoomRow(roomRow);

    const [participants] = await pool.execute(
      'SELECT user_id, identity, display_name, is_host, joined_at FROM room_participants WHERE room_id = ? AND left_at IS NULL ORDER BY joined_at ASC',
      [room.id]
    );

    for (const p of participants) {
      room.participants.set(p.identity, mapParticipantRow(p));
    }

    return room;
  }

  async hasRoom(roomCode) {
    const roomRow = await this._getRoomRowByCode(roomCode);
    return Boolean(roomRow && roomRow.status === ROOM_STATUS_ACTIVE);
  }

  async addParticipant(roomCode, participant) {
    let roomRow = await this._getRoomRowByCode(roomCode);

    if (!roomRow) {
      const creatorId = participant.userId || participant.identity;
      await this.createRoom(roomCode, creatorId);
      roomRow = await this._getRoomRowByCode(roomCode);
    }

    const hostKey = roomRow.host_user_id;
    const participantKey = participant.userId || participant.identity;
    const isHost = hostKey === participantKey;

    const participantId = randomUUID();

    await pool.execute(
      `INSERT INTO room_participants (id, room_id, user_id, identity, display_name, role, is_host, joined_at, left_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         display_name = VALUES(display_name),
         role = VALUES(role),
         is_host = VALUES(is_host),
         joined_at = NOW(),
         left_at = NULL`,
      [
        participantId,
        roomRow.id,
        participant.userId || null,
        participant.identity,
        participant.name,
        participant.role || 'student',
        isHost ? 1 : 0,
      ]
    );

    await this._insertEvent(roomRow.id, 'JOIN', participant.userId || null, {
      identity: participant.identity,
      displayName: participant.name,
      isHost,
    });

    return true;
  }

  async removeParticipant(roomCode, identity) {
    const roomRow = await this._getRoomRowByCode(roomCode);
    if (!roomRow) return false;

    const [pRows] = await pool.execute(
      'SELECT user_id, identity, display_name FROM room_participants WHERE room_id = ? AND identity = ? LIMIT 1',
      [roomRow.id, identity]
    );
    const participantRow = pRows[0] || null;

    const [result] = await pool.execute(
      'UPDATE room_participants SET left_at = NOW() WHERE room_id = ? AND identity = ? AND left_at IS NULL',
      [roomRow.id, identity]
    );

    if (!result.affectedRows) return false;

    await this._insertEvent(roomRow.id, 'LEAVE', participantRow?.user_id || null, {
      identity,
      displayName: participantRow?.display_name || null,
    });

    // ❌ REMOVED: Host transfer logic
    // Host remains the original creator PERMANENTLY
    // Even if host leaves and comes back, they will still be host
    console.log(`[RoomService] Participant ${identity} left room ${roomCode}`);

    return true;
  }

  /**
   * Kick participant khỏi phòng (CHỈ HOST được phép)
   * @param {string} roomCode - Mã phòng
   * @param {string} hostUserId - User ID của host (người kick)
   * @param {string} targetIdentity - Identity của người bị kick
   * @returns {object} Thông tin participant bị kick và LiveKit disconnect info
   */
  async kickParticipant(roomCode, hostUserId, targetIdentity) {
    const roomRow = await this._getRoomRowByCode(roomCode);
    if (!roomRow) {
      throw new Error('Room not found');
    }

    // Kiểm tra quyền host
    if (roomRow.host_user_id !== hostUserId) {
      throw new Error('Only host can kick participants');
    }

    // Lấy thông tin participant bị kick
    const [pRows] = await pool.execute(
      'SELECT user_id, identity, display_name, is_host FROM room_participants WHERE room_id = ? AND identity = ? AND left_at IS NULL LIMIT 1',
      [roomRow.id, targetIdentity]
    );
    const participantRow = pRows[0] || null;

    if (!participantRow) {
      throw new Error('Participant not found in room');
    }

    // Không cho phép kick host
    if (participantRow.is_host) {
      throw new Error('Cannot kick the host');
    }

    // Đánh dấu participant đã rời phòng
    const [result] = await pool.execute(
      'UPDATE room_participants SET left_at = NOW() WHERE room_id = ? AND identity = ? AND left_at IS NULL',
      [roomRow.id, targetIdentity]
    );

    if (!result.affectedRows) {
      throw new Error('Failed to remove participant from database');
    }

    // Log event
    await this._insertEvent(roomRow.id, 'PARTICIPANT_KICKED', hostUserId, {
      kickedIdentity: targetIdentity,
      kickedDisplayName: participantRow.display_name,
      kickedUserId: participantRow.user_id,
      kickedBy: hostUserId,
    });

    console.log(`[RoomService] 🚫 Participant ${targetIdentity} kicked from room ${roomCode} by host ${hostUserId}`);

    // Sử dụng LiveKit API để disconnect participant khỏi room
    try {
      const { RoomServiceClient } = require('livekit-server-sdk');
      const livekitConfig = require('../config/livekit.config');
      
      const roomClient = new RoomServiceClient(
        livekitConfig.url,
        livekitConfig.apiKey,
        livekitConfig.apiSecret
      );

      // Remove participant từ LiveKit room
      await roomClient.removeParticipant(roomCode, targetIdentity);
      console.log(`[RoomService] ✅ Disconnected ${targetIdentity} from LiveKit room ${roomCode}`);

      return {
        success: true,
        kickedParticipant: {
          identity: targetIdentity,
          displayName: participantRow.display_name,
          userId: participantRow.user_id,
        },
        livekitDisconnected: true,
      };
    } catch (livekitError) {
      console.error(`[RoomService] ⚠️ Failed to disconnect from LiveKit:`, livekitError.message);
      // Vẫn return success vì đã remove khỏi database
      // Client sẽ nhận được kick message và tự disconnect
      return {
        success: true,
        kickedParticipant: {
          identity: targetIdentity,
          displayName: participantRow.display_name,
          userId: participantRow.user_id,
        },
        livekitDisconnected: false,
        livekitError: livekitError.message,
      };
    }
  }

  async deleteRoom(roomCode) {
    const roomRow = await this._getRoomRowByCode(roomCode);
    if (!roomRow) return false;

    await this._insertEvent(roomRow.id, 'ROOM_DELETED', null, { roomCode });

    const [result] = await pool.execute('DELETE FROM rooms WHERE room_code = ?', [roomCode]);
    return Boolean(result.affectedRows);
  }

  async getAllRooms() {
    const [roomRows] = await pool.execute(
      'SELECT * FROM rooms WHERE status = ? ORDER BY created_at DESC',
      [ROOM_STATUS_ACTIVE]
    );

    const rooms = new Map();

    for (const row of roomRows) {
      const room = mapRoomRow(row);
      const [participants] = await pool.execute(
        'SELECT user_id, identity, display_name, is_host, joined_at FROM room_participants WHERE room_id = ? AND left_at IS NULL ORDER BY joined_at ASC',
        [room.id]
      );

      for (const p of participants) {
        room.participants.set(p.identity, mapParticipantRow(p));
      }

      rooms.set(room.roomCode, room);
    }

    return rooms;
  }

  /**
   * Kết thúc phòng (CHỈ HOST được phép)
   * @param {string} roomCode - Mã phòng
   * @param {string} userId - User ID của người request (phải là host)
   * @returns {boolean} true nếu thành công
   */
  async endRoom(roomCode, userId) {
    const roomRow = await this._getRoomRowByCode(roomCode);
    if (!roomRow) {
      throw new Error('Room not found');
    }

    // Kiểm tra phòng đã ended chưa
    if (roomRow.status === 'ended') {
      throw new Error('Room already ended');
    }

    // Kiểm tra quyền host
    const hostKey = roomRow.host_user_id;
    const userKey = userId;
    if (hostKey !== userKey) {
      throw new Error('Only host can end the room');
    }

    // ✅ Xóa toàn bộ messages của phòng này
    const messageService = require('./message.service');
    const deletedCount = await messageService.deleteMessagesByRoom(roomRow.id);
    console.log(`[RoomService] 🗑️ Deleted ${deletedCount} messages from room ${roomCode}`);

    // ✅ Xóa toàn bộ transcripts của phòng này
    const transcriptService = require('./transcript.service');
    const deletedTranscripts = await transcriptService.deleteTranscriptsByRoomId(roomRow.id);
    console.log(`[RoomService] 🗑️ Deleted ${deletedTranscripts} transcripts from room ${roomCode}`);

    // Cập nhật status và ended_at
    await pool.execute(
      'UPDATE rooms SET status = ?, ended_at = NOW() WHERE id = ?',
      ['ended', roomRow.id]
    );

    // Log event
    await this._insertEvent(roomRow.id, 'ROOM_ENDED', userId, {
      roomCode,
      endedBy: userId,
      messagesDeleted: deletedCount,
      transcriptsDeleted: deletedTranscripts,
    });

    console.log(`[RoomService] Room ${roomCode} ended by host ${userId}`);
    return true;
  }

  async cleanupOldRooms(maxAge = 60 * 60 * 1000) {
    const [rows] = await pool.execute(
      `SELECT r.id
       FROM rooms r
       LEFT JOIN room_participants p
         ON p.room_id = r.id AND p.left_at IS NULL
       WHERE r.status = ?
       GROUP BY r.id
       HAVING COUNT(p.id) = 0 AND TIMESTAMPDIFF(SECOND, r.created_at, NOW()) > ?`,
      [ROOM_STATUS_ACTIVE, Math.floor(maxAge / 1000)]
    );

    let cleanedCount = 0;

    for (const r of rows) {
      const [result] = await pool.execute('DELETE FROM rooms WHERE id = ?', [r.id]);
      cleanedCount += result.affectedRows ? 1 : 0;
    }

    if (cleanedCount > 0) {
      console.log(`[RoomService-DB] Cleaned up ${cleanedCount} inactive rooms`);
    }

    return cleanedCount;
  }

  /**
   * Xóa các phòng đã ended sau một khoảng thời gian nhất định
   * @param {number} retentionTime - Thời gian giữ lại (ms), mặc định 30 phút
   */
  async cleanupEndedRooms(retentionTime = 30 * 60 * 1000) {
    const [rows] = await pool.execute(
      `SELECT id, room_code, ended_at
       FROM rooms
       WHERE status = 'ended' 
       AND ended_at IS NOT NULL
       AND TIMESTAMPDIFF(SECOND, ended_at, NOW()) > ?`,
      [Math.floor(retentionTime / 1000)]
    );

    let cleanedCount = 0;

    for (const r of rows) {
      // Xóa room (CASCADE sẽ tự động xóa participants, messages, transcripts, events)
      const [result] = await pool.execute('DELETE FROM rooms WHERE id = ?', [r.id]);
      
      if (result.affectedRows) {
        cleanedCount++;
        console.log(`[RoomService-DB] 🗑️ Deleted ended room ${r.room_code} (ended at: ${r.ended_at})`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`[RoomService-DB] ✅ Cleaned up ${cleanedCount} ended rooms (retention: ${Math.floor(retentionTime / 60000)} minutes)`);
    }

    return cleanedCount;
  }
}

module.exports = new RoomService();
