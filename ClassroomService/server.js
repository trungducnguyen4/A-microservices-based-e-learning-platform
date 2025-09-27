import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// API: cấp token cho client tham gia room
app.post("/join-room", (req, res) => {
  const { roomName, participantName } = req.body;

  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName required" });
  }

  try {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: participantName }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = at.toJwt();
    res.json({ token, url: process.env.LIVEKIT_URL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create token" });
  }
});

app.listen(PORT, () => {
  console.log(`ClassroomService running at http://localhost:${PORT}`);
});
