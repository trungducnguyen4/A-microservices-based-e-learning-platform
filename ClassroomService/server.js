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

    if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
      return res.status(500).json({ error: "LiveKit credentials not configured" });
    }

    const at = new AccessToken(API_KEY, API_SECRET, { identity });
    at.addGrant({ roomJoin: true, room: roomName });

    const jwt = await at.toJwt();

    console.log(`[${identity}] join room: ${roomName}`);

    res.json({
      url: LIVEKIT_URL,
      token: jwt,
      identity,
      roomName,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});
