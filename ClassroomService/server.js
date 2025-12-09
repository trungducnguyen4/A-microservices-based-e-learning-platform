require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import config
const appConfig = require('./src/config/app.config');
const livekitConfig = require('./src/config/livekit.config');

// Import routes
const meetingRoutes = require('./src/routes/meeting.routes');

// Import middlewares
const requestLogger = require('./src/middlewares/requestLogger');
const errorHandler = require('./src/middlewares/errorHandler');

// Import services
const roomService = require('./src/services/room.service');

// Create Express app
const app = express();

// CORS is handled by API Gateway, but allow direct access for development
// Only enable CORS if NOT behind API Gateway (check for X-Forwarded-For header)
app.use((req, res, next) => {
  // If request comes from API Gateway, skip CORS (Gateway handles it)
  const isFromGateway = req.headers['x-forwarded-for'] || req.headers['x-forwarded-host'];
  
  if (!isFromGateway) {
    // Direct access - set CORS headers
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:8083',
      'http://localhost:8888'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Role, X-User-Name');
    }
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  
  next();
});

// Middleware
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    livekitConfigured: livekitConfig.validateConfig(),
    timestamp: new Date().toISOString(),
    activeRooms: roomService.getAllRooms().size,
  });
});

// API Routes
app.use('/api/meeting', meetingRoutes);

// Legacy endpoint for backward compatibility
app.get('/getToken', async (req, res) => {
  try {
    const roomCode = req.query.room || 'testroom';
    // Frontend gửi: user (userName), userId (actual ID), role
    const userName = req.query.user; // Display name từ frontend
    const userId = req.query.userId || req.query.user || `user_${Date.now()}`;
    const role = req.query.role || 'student';

    console.log(`[/getToken] Request - room: ${roomCode}, user: ${userName}, userId: ${userId}, role: ${role}`);

    // Redirect to new token endpoint
    const tokenService = require('./src/services/token.service');
    const tokenData = await tokenService.createTokenAndTrackParticipant(
      roomCode,
      userId,
      userName
    );

    console.log(`[/getToken] Token generated successfully for ${tokenData.name}`);

    res.json({
      url: livekitConfig.url,
      token: tokenData.token,
      identity: tokenData.identity,
      displayName: tokenData.name,
      roomName: tokenData.roomCode,
      role: role,
      // Thêm các field như code cũ
      userInfo: tokenData.userId ? {
        id: tokenData.userId,
      } : null
    });
  } catch (error) {
    console.error('[Legacy /getToken] Error:', error);
    console.error('[Legacy /getToken] Stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate token', details: error.message });
  }
});

// Legacy room check endpoint for backward compatibility
app.get('/checkRoom', async (req, res) => {
  try {
    const roomCode = req.query.room;

    if (!roomCode) {
      return res.status(400).json({
        exists: false,
        error: 'Room code is required',
      });
    }

    const exists = roomService.hasRoom(roomCode);
    const room = exists ? roomService.getRoom(roomCode) : null;

    res.json({
      exists,
      roomCode: exists ? room.roomCode : undefined,
      numParticipants: exists ? room.participants.size : 0,
      createdAt: exists ? room.createdAt : undefined,
    });
  } catch (error) {
    console.error('[Legacy /checkRoom] Error:', error);
    res.status(500).json({
      exists: false,
      error: 'Failed to check room',
    });
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Cleanup old rooms periodically (every 5 minutes)
setInterval(() => {
  const ROOM_TIMEOUT = 60 * 60 * 1000; // 1 hour
  roomService.cleanupOldRooms(ROOM_TIMEOUT);
}, 5 * 60 * 1000);

// Start server
app.listen(appConfig.port, () => {
  console.log(`\n🚀 ClassroomService running on http://localhost:${appConfig.port}`);
  console.log(`📦 Environment: ${appConfig.nodeEnv}`);
  console.log(`🔗 LiveKit URL: ${livekitConfig.url}`);
  console.log(`👤 UserService URL: ${appConfig.userServiceUrl}`);
  console.log(`✅ LiveKit configured: ${livekitConfig.validateConfig()}`);
  console.log(`🧹 Room cleanup enabled (1 hour timeout)\n`);
});
