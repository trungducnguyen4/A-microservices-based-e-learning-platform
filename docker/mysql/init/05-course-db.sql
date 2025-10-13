-- Course Service Database Schema (nếu có CourseService)
CREATE DATABASE IF NOT EXISTS course_db;
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

-- Insert demo course
INSERT IGNORE INTO courses (title, description, teacher_id, course_code) VALUES
('Introduction to Computer Science', 'A comprehensive introduction to computer science fundamentals', 2, 'CS101');

COMMIT;