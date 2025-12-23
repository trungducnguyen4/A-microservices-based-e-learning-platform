const express = require('express');
const meetingController = require('../controllers/meeting.controller');

const router = express.Router();

/**
 * @route POST /api/meeting/create
 * @desc Tạo phòng meeting mới
 * @access Public
 */
router.post('/create', (req, res) => meetingController.createRoom(req, res));

/**
 * @route GET /api/meeting/check/:roomCode
 * @desc Kiểm tra phòng có tồn tại không
 * @access Public
 */
router.get('/check/:roomCode', (req, res) => meetingController.checkRoom(req, res));

/**
 * @route GET /api/meeting/rooms
 * @desc Lấy danh sách tất cả phòng
 * @access Public
 */
router.get('/rooms', (req, res) => meetingController.getAllRooms(req, res));

/**
 * @route DELETE /api/meeting/room/:roomCode
 * @desc Xóa phòng
 * @access Public
 */
router.delete('/room/:roomCode', (req, res) => meetingController.deleteRoom(req, res));

/**
 * @route POST /api/meeting/token
 * @desc Lấy token để tham gia phòng
 * @access Public
 */
router.post('/token', (req, res) => meetingController.getToken(req, res));

/**
 * @route POST /api/meeting/participant-left
 * @desc Notify that a participant has left the room
 * @access Public
 */
router.post('/participant-left', (req, res) => meetingController.participantLeft(req, res));

module.exports = router;
