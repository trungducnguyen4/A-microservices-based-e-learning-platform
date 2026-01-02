const express = require('express');
const transcriptController = require('../controllers/transcript.controller');

const router = express.Router();

/**
 * POST /api/transcript/save
 * Lưu một transcript segment
 */
router.post('/save', (req, res) => transcriptController.saveSegment(req, res));

/**
 * POST /api/transcript/save-batch
 * Lưu nhiều transcript segments
 */
router.post('/save-batch', (req, res) => transcriptController.saveSegments(req, res));

/**
 * GET /api/transcript/:roomCode
 * Lấy tất cả transcript của một phòng
 */
router.get('/:roomCode', (req, res) => transcriptController.getTranscripts(req, res));

/**
 * DELETE /api/transcript/:roomCode
 * Xóa tất cả transcript của một phòng
 */
router.delete('/:roomCode', (req, res) => transcriptController.deleteTranscripts(req, res));

module.exports = router;
