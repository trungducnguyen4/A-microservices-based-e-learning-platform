-- Classroom Service Database Schema
CREATE DATABASE IF NOT EXISTS classroom_db;
USE classroom_db;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id CHAR(36) NOT NULL,
  room_code VARCHAR(32) NOT NULL,
  title VARCHAR(255) NULL,
  created_by VARCHAR(36) NOT NULL,
  host_user_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  max_participants INT NOT NULL DEFAULT 200,

  PRIMARY KEY (id),
  UNIQUE KEY uk_rooms_room_code (room_code),
  KEY idx_rooms_host_user_id (host_user_id),
  KEY idx_rooms_created_by (created_by),
  KEY idx_rooms_status (status),
  KEY idx_rooms_status_ended (status, ended_at)
);

-- Room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id CHAR(36) NOT NULL,
  room_id CHAR(36) NOT NULL,
  user_id VARCHAR(36) NULL,
  identity VARCHAR(128) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  is_host TINYINT(1) NOT NULL DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  metadata JSON NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_participants_room_identity (room_id, identity),
  KEY idx_participants_room_id (room_id),
  KEY idx_participants_user_id (user_id),
  CONSTRAINT fk_participants_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Room messages table (chat persistence)
CREATE TABLE IF NOT EXISTS room_messages (
  id CHAR(36) NOT NULL,
  room_id CHAR(36) NOT NULL,
  sender_user_id VARCHAR(36) NULL,
  sender_name VARCHAR(255) NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_messages_room_id_created_at (room_id, created_at),
  KEY idx_messages_created_at (created_at),
  CONSTRAINT fk_messages_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Room events table (simple log)
CREATE TABLE IF NOT EXISTS room_events (
  id CHAR(36) NOT NULL,
  room_id CHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  actor_user_id VARCHAR(36) NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_events_room_id_created_at (room_id, created_at),
  KEY idx_events_type (event_type),
  CONSTRAINT fk_events_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Room transcripts table (Groq AI transcription)
CREATE TABLE IF NOT EXISTS room_transcripts (
  id CHAR(36) NOT NULL,
  room_id CHAR(36) NOT NULL,
  segment_index INT NOT NULL,
  speaker_identity VARCHAR(128) NULL,
  speaker_name VARCHAR(255) NULL,
  text TEXT NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_transcript_room_segment (room_id, segment_index),
  KEY idx_transcript_room_id_created_at (room_id, created_at),
  CONSTRAINT fk_transcript_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

COMMIT;
