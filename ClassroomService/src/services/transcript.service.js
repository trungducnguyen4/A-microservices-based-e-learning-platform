const { randomUUID } = require('crypto');
const pool = require('../db/pool');

/**
 * Service quản lý transcript của phòng
 */
class TranscriptService {
  /**
   * Lưu transcript segment vào database
   * @param {string} roomCode - Mã phòng
   * @param {object} segment - Transcript segment
   * @param {number} segment.index - Index của segment
   * @param {string} segment.text - Nội dung text
   * @param {string} segment.timestamp - Timestamp
   * @param {string} segment.speakerIdentity - Identity của người nói (optional)
   * @param {string} segment.speakerName - Tên người nói (optional)
   */
  async saveTranscriptSegment(roomCode, segment) {
    try {
      // Lấy room ID
      const [rooms] = await pool.execute(
        'SELECT id FROM rooms WHERE room_code = ? LIMIT 1',
        [roomCode]
      );

      if (rooms.length === 0) {
        throw new Error('Room not found');
      }

      const roomId = rooms[0].id;
      const transcriptId = randomUUID();

      // Insert hoặc update transcript segment
      await pool.execute(
        `INSERT INTO room_transcripts 
         (id, room_id, segment_index, speaker_identity, speaker_name, text, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           speaker_identity = VALUES(speaker_identity),
           speaker_name = VALUES(speaker_name),
           text = VALUES(text),
           timestamp = VALUES(timestamp)`,
        [
          transcriptId,
          roomId,
          segment.index,
          segment.speakerIdentity || null,
          segment.speakerName || null,
          segment.text,
          segment.timestamp,
        ]
      );

      console.log(`[TranscriptService] 💾 Saved transcript segment ${segment.index} for room ${roomCode}`);
      return true;
    } catch (error) {
      console.error('[TranscriptService] Error saving transcript segment:', error);
      throw error;
    }
  }

  /**
   * Lưu nhiều transcript segments
   * @param {string} roomCode - Mã phòng
   * @param {array} segments - Array of transcript segments
   */
  async saveTranscriptSegments(roomCode, segments) {
    try {
      if (!segments || segments.length === 0) {
        return { saved: 0 };
      }

      // Lấy room ID
      const [rooms] = await pool.execute(
        'SELECT id FROM rooms WHERE room_code = ? LIMIT 1',
        [roomCode]
      );

      if (rooms.length === 0) {
        throw new Error('Room not found');
      }

      const roomId = rooms[0].id;
      let savedCount = 0;

      // Lưu từng segment
      for (const segment of segments) {
        const transcriptId = randomUUID();
        
        await pool.execute(
          `INSERT INTO room_transcripts 
           (id, room_id, segment_index, speaker_identity, speaker_name, text, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             speaker_identity = VALUES(speaker_identity),
             speaker_name = VALUES(speaker_name),
             text = VALUES(text),
             timestamp = VALUES(timestamp)`,
          [
            transcriptId,
            roomId,
            segment.index,
            segment.speakerIdentity || null,
            segment.speakerName || null,
            segment.text,
            segment.timestamp,
          ]
        );

        savedCount++;
      }

      console.log(`[TranscriptService] 💾 Saved ${savedCount} transcript segments for room ${roomCode}`);
      return { saved: savedCount };
    } catch (error) {
      console.error('[TranscriptService] Error saving transcript segments:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả transcript của một phòng
   * @param {string} roomCode - Mã phòng
   * @returns {array} Array of transcript segments
   */
  async getTranscripts(roomCode) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
           t.segment_index,
           t.speaker_identity,
           t.speaker_name,
           t.text,
           t.timestamp,
           t.created_at
         FROM room_transcripts t
         JOIN rooms r ON t.room_id = r.id
         WHERE r.room_code = ?
         ORDER BY t.segment_index ASC`,
        [roomCode]
      );

      const transcripts = rows.map(row => ({
        index: row.segment_index,
        speakerIdentity: row.speaker_identity,
        speakerName: row.speaker_name,
        text: row.text,
        timestamp: row.timestamp,
        createdAt: row.created_at,
      }));

      console.log(`[TranscriptService] 📖 Retrieved ${transcripts.length} transcript segments for room ${roomCode}`);
      return transcripts;
    } catch (error) {
      console.error('[TranscriptService] Error getting transcripts:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả transcript của một phòng
   * @param {string} roomId - ID của phòng (không phải room code)
   * @returns {number} Số lượng transcript đã xóa
   */
  async deleteTranscriptsByRoomId(roomId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM room_transcripts WHERE room_id = ?',
        [roomId]
      );

      console.log(`[TranscriptService] 🗑️ Deleted ${result.affectedRows} transcripts for room ID ${roomId}`);
      return result.affectedRows || 0;
    } catch (error) {
      console.error('[TranscriptService] Error deleting transcripts:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả transcript của một phòng theo room code
   * @param {string} roomCode - Mã phòng
   * @returns {number} Số lượng transcript đã xóa
   */
  async deleteTranscriptsByRoomCode(roomCode) {
    try {
      const [rooms] = await pool.execute(
        'SELECT id FROM rooms WHERE room_code = ? LIMIT 1',
        [roomCode]
      );

      if (rooms.length === 0) {
        return 0;
      }

      return await this.deleteTranscriptsByRoomId(rooms[0].id);
    } catch (error) {
      console.error('[TranscriptService] Error deleting transcripts by room code:', error);
      throw error;
    }
  }
}

module.exports = new TranscriptService();
