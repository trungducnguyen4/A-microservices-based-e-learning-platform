-- Updated schema for HomeworkService
-- This schema is more closely aligned with our entity classes

-- Drop tables if they exist to recreate
DROP TABLE IF EXISTS submission_comment;
DROP TABLE IF EXISTS submission_file;
DROP TABLE IF EXISTS submission;
DROP TABLE IF EXISTS homework_attachment;
DROP TABLE IF EXISTS homework;

-- Homework table
CREATE TABLE IF NOT EXISTS homework (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    course_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36),
    assigned_to JSON,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    max_score DECIMAL(10,2) NOT NULL,
    submission_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    grading_rubric JSON,
    grade_release_date TIMESTAMP,
    auto_grade BOOLEAN DEFAULT FALSE,
    allow_late_submissions BOOLEAN DEFAULT FALSE,
    late_penalty JSON,
    max_attempts INT,
    anonymous_submission BOOLEAN DEFAULT FALSE,
    score_type VARCHAR(50) DEFAULT 'POINTS',
    submission_window_start TIMESTAMP,
    submission_window_end TIMESTAMP,
    allowed_file_types JSON,
    max_file_size_mb INT,
    enable_plagiarism_check BOOLEAN DEFAULT FALSE,
    plagiarism_provider VARCHAR(100),
    peer_review_enabled BOOLEAN DEFAULT FALSE,
    peer_review_config JSON,
    group_assignment BOOLEAN DEFAULT FALSE,
    group_ids JSON,
    resubmission_allowed BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    attachments JSON,
    estimated_duration_minutes INT,
    tags JSON
);

-- Homework attachments table
CREATE TABLE IF NOT EXISTS homework_attachment (
    id VARCHAR(36) PRIMARY KEY,
    homework_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url VARCHAR(1000) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE
);

-- Submission table
CREATE TABLE IF NOT EXISTS submission (
    id VARCHAR(36) PRIMARY KEY,
    homework_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36),
    content TEXT,
    attachments JSON,
    status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP,
    score DECIMAL(10,2),
    percentage DECIMAL(5,2),
    letter_grade VARCHAR(10),
    feedback TEXT,
    graded_by VARCHAR(36),
    attempt_number INT DEFAULT 1,
    is_late BOOLEAN DEFAULT FALSE,
    minutes_late INT,
    late_penalty_applied DECIMAL(5,2),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    plagiarism_result JSON,
    similarity_score DECIMAL(5,2),
    peer_review_assignments JSON,
    peer_review_scores JSON,
    original_score DECIMAL(10,2),
    rubric_scores JSON,
    private_notes TEXT,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE
);

-- Submission file table
CREATE TABLE IF NOT EXISTS submission_file (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url VARCHAR(1000) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submission(id) ON DELETE CASCADE
);

-- Submission comments table
CREATE TABLE IF NOT EXISTS submission_comment (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (submission_id) REFERENCES submission(id) ON DELETE CASCADE
);