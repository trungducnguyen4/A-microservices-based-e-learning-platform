-- Migration: Add room_transcripts table
-- Run this on your classroom_db

USE classroom_db;

-- Ensure rooms table exists first
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create room_transcripts table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
