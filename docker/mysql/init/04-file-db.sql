-- File Service Database Schema (nếu cần)
CREATE DATABASE IF NOT EXISTS file_db;
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

COMMIT;