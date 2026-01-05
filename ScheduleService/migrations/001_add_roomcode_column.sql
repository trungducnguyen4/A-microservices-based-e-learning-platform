-- Add roomCode column to schedules table for classroom service integration
-- This column stores the room code used by ClassroomService for virtual classroom management

-- Add column if it doesn't exist
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS room_code VARCHAR(255) NULL COMMENT 'Room code for classroom service';

-- Create UNIQUE index allowing multiple NULLs (MySQL behavior for NULL UNIQUE)
-- This allows multiple schedules without room codes while enforcing uniqueness on non-NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_code_unique ON schedules(room_code);

-- Create regular index for faster lookups
CREATE INDEX IF NOT EXISTS idx_room_code ON schedules(room_code);
