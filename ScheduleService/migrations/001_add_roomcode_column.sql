-- Add roomCode column to schedules table if it doesn't exist
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS room_code VARCHAR(255) UNIQUE NULL COMMENT 'Room code for classroom service';

-- Create index on room_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_room_code ON schedules(room_code);
