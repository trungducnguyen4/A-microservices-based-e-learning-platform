package org.tduc.homeworkservice.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // General errors
    INVALID_REQUEST(9001, "Invalid request", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(9002, "Unauthorized access", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(9003, "Access forbidden", HttpStatus.FORBIDDEN),
    INTERNAL_SERVER_ERROR(9999, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    
    // Homework related errors
    HOMEWORK_NOT_FOUND(1001, "Homework not found", HttpStatus.NOT_FOUND),
    HOMEWORK_NOT_PUBLISHED(1002, "Homework is not published yet", HttpStatus.BAD_REQUEST),
    INVALID_DUE_DATE(1003, "Due date must be in the future", HttpStatus.BAD_REQUEST),
    HOMEWORK_ALREADY_EXISTS(1004, "Homework with this title already exists in the course", HttpStatus.CONFLICT),
    INVALID_HOMEWORK_STATUS(1005, "Invalid homework status transition", HttpStatus.BAD_REQUEST),
    
    // Submission related errors
    SUBMISSION_NOT_FOUND(2001, "Submission not found", HttpStatus.NOT_FOUND),
    LATE_SUBMISSION_NOT_ALLOWED(2002, "Late submission is not allowed for this homework", HttpStatus.BAD_REQUEST),
    RESUBMISSION_NOT_ALLOWED(2003, "Resubmission is not allowed for this homework", HttpStatus.BAD_REQUEST),
    MAX_ATTEMPTS_EXCEEDED(2004, "Maximum submission attempts exceeded", HttpStatus.BAD_REQUEST),
    INVALID_SCORE(2005, "Score must be between 0 and maximum homework score", HttpStatus.BAD_REQUEST),
    SUBMISSION_ALREADY_GRADED(2006, "Submission has already been graded", HttpStatus.BAD_REQUEST),
    SUBMISSION_WINDOW_NOT_OPEN(2007, "Submission window is not yet open", HttpStatus.BAD_REQUEST),
    SUBMISSION_WINDOW_CLOSED(2008, "Submission window has closed", HttpStatus.BAD_REQUEST),
    EMPTY_SUBMISSION_CONTENT(2009, "Submission content cannot be empty", HttpStatus.BAD_REQUEST),
    
    // File related errors
    FILE_NOT_FOUND(3001, "File not found", HttpStatus.NOT_FOUND),
    INVALID_FILE_TYPE(3002, "Invalid file type. Only certain file types are allowed", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED(3003, "File size exceeded maximum limit", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(3004, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    ATTACHMENT_NOT_FOUND(3005, "Attachment not found", HttpStatus.NOT_FOUND),
    
    // Validation errors
    INVALID_PAGE_PARAMETERS(4001, "Invalid page parameters", HttpStatus.BAD_REQUEST),
    INVALID_SORT_PARAMETERS(4002, "Invalid sort parameters", HttpStatus.BAD_REQUEST),
    MISSING_REQUIRED_FIELD(4003, "Required field is missing", HttpStatus.BAD_REQUEST),
    INVALID_DATE_RANGE(4004, "Invalid date range", HttpStatus.BAD_REQUEST),
    
    // Course and User related errors
    COURSE_NOT_FOUND(5001, "Course not found", HttpStatus.NOT_FOUND),
    STUDENT_NOT_ENROLLED(5002, "Student is not enrolled in this course", HttpStatus.FORBIDDEN),
    TEACHER_NOT_ASSIGNED(5003, "Teacher is not assigned to this course", HttpStatus.FORBIDDEN),
    INVALID_USER_ROLE(5004, "Invalid user role for this operation", HttpStatus.FORBIDDEN),
    
    // Grading related errors
    GRADING_RUBRIC_NOT_FOUND(6001, "Grading rubric not found", HttpStatus.NOT_FOUND),
    INVALID_RUBRIC_SCORES(6002, "Invalid rubric scores provided", HttpStatus.BAD_REQUEST),
    GRADE_RELEASE_NOT_ALLOWED(6003, "Grade release is not allowed yet", HttpStatus.BAD_REQUEST),
    
    // Comment related errors
    COMMENT_NOT_FOUND(7001, "Comment not found", HttpStatus.NOT_FOUND),
    INVALID_COMMENT_CONTENT(7002, "Comment content is invalid", HttpStatus.BAD_REQUEST),
    COMMENT_UPDATE_NOT_ALLOWED(7003, "Comment update is not allowed", HttpStatus.FORBIDDEN);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}