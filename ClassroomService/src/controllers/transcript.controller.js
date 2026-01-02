const transcriptService = require('../services/transcript.service');

/**
 * Controller xử lý các request liên quan đến transcript
 */
class TranscriptController {
  /**
   * Lưu transcript segment
   * POST /api/transcript/save
   * Body: { roomCode, segment: { index, text, timestamp, speakerIdentity?, speakerName? } }
   */
  async saveSegment(req, res) {
    try {
      const { roomCode, segment } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      if (!segment || typeof segment.index !== 'number' || !segment.text || !segment.timestamp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid segment data. Required: index, text, timestamp',
        });
      }

      await transcriptService.saveTranscriptSegment(roomCode, segment);

      res.json({
        success: true,
        message: 'Transcript segment saved successfully',
      });
    } catch (error) {
      console.error('[TranscriptController] Error saving segment:', error);
      
      if (error.message === 'Room not found') {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to save transcript segment',
        error: error.message,
      });
    }
  }

  /**
   * Lưu nhiều transcript segments
   * POST /api/transcript/save-batch
   * Body: { roomCode, segments: [{ index, text, timestamp, speakerIdentity?, speakerName? }] }
   */
  async saveSegments(req, res) {
    try {
      const { roomCode, segments } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      if (!segments || !Array.isArray(segments)) {
        return res.status(400).json({
          success: false,
          message: 'Segments must be an array',
        });
      }

      const result = await transcriptService.saveTranscriptSegments(roomCode, segments);

      res.json({
        success: true,
        message: `Saved ${result.saved} transcript segments`,
        data: result,
      });
    } catch (error) {
      console.error('[TranscriptController] Error saving segments:', error);
      
      if (error.message === 'Room not found') {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to save transcript segments',
        error: error.message,
      });
    }
  }

  /**
   * Lấy tất cả transcript của một phòng
   * GET /api/transcript/:roomCode
   */
  async getTranscripts(req, res) {
    try {
      const { roomCode } = req.params;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      const transcripts = await transcriptService.getTranscripts(roomCode);

      res.json({
        success: true,
        count: transcripts.length,
        data: transcripts,
      });
    } catch (error) {
      console.error('[TranscriptController] Error getting transcripts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transcripts',
        error: error.message,
      });
    }
  }

  /**
   * Xóa tất cả transcript của một phòng
   * DELETE /api/transcript/:roomCode
   */
  async deleteTranscripts(req, res) {
    try {
      const { roomCode } = req.params;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          message: 'Room code is required',
        });
      }

      const deletedCount = await transcriptService.deleteTranscriptsByRoomCode(roomCode);

      res.json({
        success: true,
        message: `Deleted ${deletedCount} transcript segments`,
        data: { deletedCount },
      });
    } catch (error) {
      console.error('[TranscriptController] Error deleting transcripts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transcripts',
        error: error.message,
      });
    }
  }
}

module.exports = new TranscriptController();
