-- Create database schema for E-Learning Platform
CREATE DATABASE IF NOT EXISTS e_learning;
USE e_learning;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id BIGINT NOT NULL,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    credits INT DEFAULT 3,
    max_students INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_course_code (course_code)
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ENROLLED', 'COMPLETED', 'DROPPED') DEFAULT 'ENROLLED',
    grade DECIMAL(5,2),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student (student_id),
    INDEX idx_course (course_id)
);

-- Homework/Assignments table
CREATE TABLE IF NOT EXISTS homework (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    max_points INT DEFAULT 100,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
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
    student_id BIGINT NOT NULL,
    submission_text TEXT,
    file_path VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    grade DECIMAL(5,2),
    feedback TEXT,
    status ENUM('DRAFT', 'SUBMITTED', 'GRADED') DEFAULT 'DRAFT',
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (homework_id, student_id),
    INDEX idx_homework (homework_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
);

-- Schedules/Classes table
CREATE TABLE IF NOT EXISTS schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
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
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_start_time (start_time)
);

-- File uploads
CREATE TABLE IF NOT EXISTS file_uploads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by BIGINT NOT NULL,
    upload_type ENUM('HOMEWORK_SUBMISSION', 'COURSE_MATERIAL', 'PROFILE_PICTURE', 'OTHER') NOT NULL,
    reference_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_reference (upload_type, reference_id)
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@elearning.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'ADMIN');

-- Insert demo teacher (password: teacher123)
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('teacher1', 'teacher@elearning.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Teacher', 'TEACHER');

-- Insert demo student (password: student123)
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('student1', 'student@elearning.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Student', 'STUDENT');

-- Insert demo course
INSERT IGNORE INTO courses (title, description, teacher_id, course_code) VALUES
('Introduction to Computer Science', 'A comprehensive introduction to computer science fundamentals', 2, 'CS101');

-- Insert demo homework
INSERT IGNORE INTO homework (title, description, course_id, teacher_id, due_date) VALUES
('First Assignment', 'Complete the basic programming exercises', 1, 2, DATE_ADD(NOW(), INTERVAL 7 DAY));

COMMIT;