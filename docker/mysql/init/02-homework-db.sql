-- Homework Service Database Schema
CREATE DATABASE IF NOT EXISTS homework_db;
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

-- Insert demo homework
INSERT IGNORE INTO homework (title, description, course_id, teacher_id, due_date) VALUES
('First Assignment', 'Complete the basic programming exercises', 1, 2, DATE_ADD(NOW(), INTERVAL 7 DAY));

COMMIT;