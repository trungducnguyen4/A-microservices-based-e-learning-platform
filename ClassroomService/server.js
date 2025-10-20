require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Sử dụng environment variables từ .env
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const PORT = process.env.PORT || 4000;

app.get("/getToken", async (req, res) => {
  try {
    const roomName = req.query.room || "testroom";
    const identity = req.query.user || "user" + Math.floor(Math.random() * 1000);
    const role = req.query.role || "student"; // teacher, student, admin

    if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
      return res.status(500).json({ error: "LiveKit credentials not configured" });
    }

    // Generate random color for user avatar
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const at = new AccessToken(API_KEY, API_SECRET, { 
      identity,
      metadata: JSON.stringify({
        role: role,
        avatarColor: avatarColor,
        joinedAt: new Date().toISOString()
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

    console.log(`[${identity}] (${role}) join room: ${roomName}`);

    res.json({
      url: LIVEKIT_URL,
      token: jwt,
      identity,
      roomName,
      role,
      avatarColor,
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

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});
