const express = require('express');
const meetingController = require('../controllers/meeting.controller');
const messageController = require('../controllers/message.controller');

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
 * @route POST /api/meeting/end/:roomCode
 * @desc Kết thúc phòng (CHỈ HOST)
 * @access Public
 */
router.post('/end/:roomCode', (req, res) => meetingController.endRoom(req, res));

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

/**
 * @route POST /api/meeting/kick-participant
 * @desc Kick a participant from the room (HOST ONLY)
 * @access Public (with host permission check)
 */
router.post('/kick-participant', (req, res) => meetingController.kickParticipant(req, res));

/**
 * @route POST /api/meeting/message
 * @desc Gửi message vào phòng
 * @access Public
 */
router.post('/message', (req, res) => messageController.sendMessage(req, res));

/**
 * @route GET /api/meeting/messages/:roomCode
 * @desc Lấy danh sách message của phòng
 * @access Public
 */
router.get('/messages/:roomCode', (req, res) => messageController.getMessages(req, res));

module.exports = router;

