require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Sử dụng environment variables từ .env
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8080";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "https://localhost:8080";
const PORT = process.env.PORT || 4000;

// In-memory store để track created rooms
// Format: { roomCode: { createdAt: timestamp, createdBy: userId, participants: [] } }
const activeRooms = new Map();

app.get("/getToken", async (req, res) => {
  try {
    const roomName = req.query.room || "testroom";
    const identity = req.query.user || "user" + Math.floor(Math.random() * 1000);
    const userId = req.query.userId; // Optional: userId từ meeting system
    let role = req.query.role || "student"; // teacher, student, admin, guest

    if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
      return res.status(500).json({ error: "LiveKit credentials not configured" });
    }

    // Generate random color for user avatar
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    let userInfo = null;
    let displayName = identity;
    
    // Nếu có userId, lấy thông tin từ UserService
    if (userId) {
      try {
        console.log(`[ClassroomService] Fetching user info for userId: ${userId}`);
        const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/public/${userId}`);
        
        if (userResponse.data && userResponse.data.result) {
          userInfo = userResponse.data.result;
          displayName = userInfo.fullName || userInfo.username || identity;
          
          // Override role from user data if available (trong future có thể thêm role vào UserService)
          console.log(`[ClassroomService] User info retrieved: ${displayName}`);
        }
      } catch (error) {
        console.warn(`[ClassroomService] Failed to fetch user info for ${userId}:`, error.message);
        // Continue với identity ban đầu nếu UserService fail
      }
    }

    const at = new AccessToken(API_KEY, API_SECRET, { 
      identity,
      metadata: JSON.stringify({
        userId: userId || null,
        displayName: displayName,
        role: role,
        avatarColor: avatarColor,
        joinedAt: new Date().toISOString(),
        email: userInfo?.email || null
      })
    });

    // Set permissions based on role
    const roomOptions = {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    // Teachers get additional permissions
    if (role === "teacher" || role === "admin") {
      roomOptions.roomAdmin = true;
      roomOptions.hidden = false;
      roomOptions.recorder = true;
    }

    at.addGrant(roomOptions);

    const jwt = await at.toJwt();

    console.log(`[${displayName}] (${role}) join room: ${roomName}`);

    // Track room creation/join
    if (!activeRooms.has(roomName)) {
      activeRooms.set(roomName, {
        createdAt: Date.now(),
        createdBy: userId || identity,
        participants: []
      });
      console.log(`[ClassroomService] Room ${roomName} created`);
    }
    
    // Add participant to room
    const roomData = activeRooms.get(roomName);
    if (!roomData.participants.find(p => p.identity === identity)) {
      roomData.participants.push({
        identity,
        userId,
        displayName,
        role,
        joinedAt: Date.now()
      });
    }

    res.json({
      url: LIVEKIT_URL,
      token: jwt,
      identity,
      displayName,
      roomName,
      role,
      avatarColor,
      userInfo: userInfo ? {
        id: userInfo.id,
        username: userInfo.username,
        fullName: userInfo.fullName,
        email: userInfo.email
      } : null
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    livekitConfigured: !!(API_KEY && API_SECRET && LIVEKIT_URL),
    timestamp: new Date().toISOString()
  });
});

// Check if room exists
app.get("/checkRoom", async (req, res) => {
  try {
    const roomCode = req.query.room;
    
    if (!roomCode) {
      return res.status(400).json({ 
        exists: false, 
        error: "Room code is required" 
      });
    }

    // Validate room code format
    const roomCodePattern = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/;
    if (!roomCodePattern.test(roomCode)) {
      return res.status(400).json({ 
        exists: false, 
        error: "Invalid room code format" 
      });
    }

    // Check in-memory store first
    if (activeRooms.has(roomCode)) {
      const roomData = activeRooms.get(roomCode);
      console.log(`[ClassroomService] Room ${roomCode} found in memory with ${roomData.participants.length} participants`);
      
      return res.json({
        exists: true,
        roomCode: roomCode,
        numParticipants: roomData.participants.length,
        createdAt: roomData.createdAt
      });
    }

    // If not in memory, check LiveKit API
    const { RoomServiceClient } = require("livekit-server-sdk");
    const roomClient = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

    try {
      const allRooms = await roomClient.listRooms();
      const roomExists = allRooms.some(room => room.name === roomCode);
      
      if (roomExists) {
        const room = allRooms.find(r => r.name === roomCode);
        console.log(`[ClassroomService] Room ${roomCode} found in LiveKit with ${room.numParticipants} participants`);
        
        // Add back to memory
        activeRooms.set(roomCode, {
          createdAt: room.creationTime || Date.now(),
          createdBy: 'unknown',
          participants: []
        });
        
        return res.json({
          exists: true,
          roomCode: roomCode,
          numParticipants: room.numParticipants,
          creationTime: room.creationTime
        });
      }
    } catch (liveKitError) {
      console.log(`[ClassroomService] LiveKit check failed:`, liveKitError.message);
    }

    // Room not found anywhere
    console.log(`[ClassroomService] Room ${roomCode} not found`);
    return res.json({
      exists: false,
      error: "Meeting room not found. Please check the code."
    });
    
  } catch (error) {
    console.error("[ClassroomService] Error checking room:", error);
    res.status(500).json({ 
      exists: false, 
      error: "Failed to check room existence" 
    });
  }
});

// Get room info (optional, for future expansion)
app.get("/rooms/:roomName", async (req, res) => {
  try {
    const { roomName } = req.params;
    
    // This is a placeholder - you can implement room info retrieval
    // using LiveKit's RoomService API if needed
    
    res.json({
      roomName,
      message: "Room info endpoint - implement with LiveKit RoomService API"
    });
  } catch (error) {
    console.error("Error getting room info:", error);
    res.status(500).json({ error: "Failed to get room info" });
  }
});

// Cleanup empty rooms periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 60 * 60 * 1000; // 1 hour

  for (const [roomCode, roomData] of activeRooms.entries()) {
    // Remove rooms older than 1 hour with no recent activity
    if (now - roomData.createdAt > ROOM_TIMEOUT && roomData.participants.length === 0) {
      activeRooms.delete(roomCode);
      console.log(`[ClassroomService] Cleaned up inactive room: ${roomCode}`);
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
  console.log(`Backend chạy tại https://localhost:${PORT}`);
  console.log(`Room validation enabled`);
});
