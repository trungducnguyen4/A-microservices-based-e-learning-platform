const express = require('express');
const cleanupController = require('../controllers/cleanup.controller');

const router = express.Router();

/**
 * @route POST /api/admin/cleanup/messages
 * @desc Xóa messages cũ (từ phòng đã ended > N ngày)
 * @access Admin
 */
router.post('/cleanup/messages', (req, res) => cleanupController.cleanupMessages(req, res));

/**
 * @route POST /api/admin/cleanup/events
 * @desc Xóa events cũ (từ phòng đã ended > N ngày)
 * @access Admin
 */
router.post('/cleanup/events', (req, res) => cleanupController.cleanupEvents(req, res));

/**
 * @route POST /api/admin/cleanup/all
 * @desc Xóa TẤT CẢ data cũ (messages + events)
 * @access Admin
 */
router.post('/cleanup/all', (req, res) => cleanupController.cleanupAll(req, res));

/**
 * @route GET /api/admin/stats
 * @desc Lấy thống kê storage (số lượng rooms/messages/events/participants)
 * @access Admin
 */
router.get('/stats', (req, res) => cleanupController.getStats(req, res));

module.exports = router;
