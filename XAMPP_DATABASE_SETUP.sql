-- Script to create separate databases for microservices in XAMPP MySQL
-- Run this in phpMyAdmin or MySQL command line

-- Create databases
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS homework_db;
CREATE DATABASE IF NOT EXISTS schedule_db;
CREATE DATABASE IF NOT EXISTS file_db;
CREATE DATABASE IF NOT EXISTS course_db;
CREATE DATABASE IF NOT EXISTS classroom_db;

-- Use user_db and create tables
USE user_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Insert default users
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@elearning.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'ADMIN'),
('teacher1', 'teacher@elearning.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Teacher', 'TEACHER'),
('student1', 'student@elearning.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Student', 'STUDENT');

-- Use homework_db and create tables
USE homework_db;

-- Homework/Assignments table
CREATE TABLE IF NOT EXISTS homework (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id BIGINT NOT NULL, -- Reference to CourseService (via API)
    teacher_id BIGINT NOT NULL, -- Reference to UserService (via API)
    due_date TIMESTAMP NOT NULL,
    max_points INT DEFAULT 100,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_due_date (due_date)
);

-- Homework questions
CREATE TABLE IF NOT EXISTS homework_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    homework_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TEXT', 'FILE_UPLOAD') NOT NULL,
    points INT DEFAULT 10,
    question_order INT NOT NULL,
    options JSON,
    correct_answer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    INDEX idx_homework (homework_id)
);

-- Student homework submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    homework_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL, -- Reference to UserService (via API)
    submission_text TEXT,
    file_path VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    grade DECIMAL(5,2),
    feedback TEXT,
    status ENUM('DRAFT', 'SUBMITTED', 'GRADED') DEFAULT 'DRAFT',
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (homework_id, student_id),
    INDEX idx_homework (homework_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
);

-- Use schedule_db and create tables
USE schedule_db;

-- Schedules/Classes table
CREATE TABLE IF NOT EXISTS schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL, -- Reference to CourseService (via API)
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(100),
    is_online BOOLEAN DEFAULT FALSE,
    meeting_url VARCHAR(500),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_start_time (start_time)
);

-- Use file_db and create tables
USE file_db;

-- File uploads
CREATE TABLE IF NOT EXISTS file_uploads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by BIGINT NOT NULL, -- Reference to UserService (via API)
    upload_type ENUM('HOMEWORK_SUBMISSION', 'COURSE_MATERIAL', 'PROFILE_PICTURE', 'OTHER') NOT NULL,
    reference_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_reference (upload_type, reference_id)
);

-- Use course_db and create tables (if needed)
USE course_db;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id BIGINT NOT NULL, -- Reference to UserService (via API)
    course_code VARCHAR(20) UNIQUE NOT NULL,
    credits INT DEFAULT 3,
    max_students INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_course_code (course_code)
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL, -- Reference to UserService (via API)
    course_id BIGINT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ENROLLED', 'COMPLETED', 'DROPPED') DEFAULT 'ENROLLED',
    grade DECIMAL(5,2),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student (student_id),
    INDEX idx_course (course_id)
);

-- Insert demo data
INSERT IGNORE INTO courses (title, description, teacher_id, course_code) VALUES
('Introduction to Computer Science', 'A comprehensive introduction to computer science fundamentals', 2, 'CS101');

USE homework_db;
INSERT IGNORE INTO homework (title, description, course_id, teacher_id, due_date) VALUES
('First Assignment', 'Complete the basic programming exercises', 1, 2, DATE_ADD(NOW(), INTERVAL 7 DAY));

COMMIT;

-- ==========================
-- ClassroomService (classroom_db)
-- ==========================
USE classroom_db;

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