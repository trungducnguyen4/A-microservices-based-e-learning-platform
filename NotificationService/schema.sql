-- NotificationService Database Schema

CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE notification_db;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'info, warning, success, error, homework, class, grade',
  title VARCHAR(255),
  message TEXT NOT NULL,
  metadata JSON COMMENT 'Additional data like homeworkId, scheduleId, etc.',
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User calendar tokens (for Google Calendar OAuth)
CREATE TABLE IF NOT EXISTS user_calendar_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedule to Calendar mapping
CREATE TABLE IF NOT EXISTS schedule_calendar_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  calendar_event_id VARCHAR(255) NOT NULL COMMENT 'Google Calendar Event ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_schedule_user (schedule_id, user_id),
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_user_id (user_id),
  INDEX idx_event_id (calendar_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email queue status (for tracking sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient (recipient),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, metadata) VALUES
('user_001', 'info', 'Welcome!', 'Welcome to E-Learning Platform', '{"source": "system"}'),
('user_001', 'homework', 'New Homework', 'Math Assignment has been posted', '{"homeworkId": "hw_001"}'),
('user_002', 'class', 'Class Starting Soon', 'Your Math class starts in 10 minutes', '{"scheduleId": "sch_001", "roomCode": "MATH101"}');

-- Display schema info
SELECT 
    'notification_db' as database_name,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'notification_db';

SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables
WHERE table_schema = 'notification_db'
ORDER BY table_name;
