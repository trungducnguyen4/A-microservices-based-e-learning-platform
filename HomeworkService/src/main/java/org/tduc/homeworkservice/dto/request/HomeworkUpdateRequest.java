package org.tduc.homeworkservice.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.homeworkservice.model.HomeworkStatus;
import org.tduc.homeworkservice.model.ScoreType;
import org.tduc.homeworkservice.model.SubmissionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeworkUpdateRequest {
    
    @Size(max = 500, message = "Title must not exceed 500 characters")
    String title;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    String description;
    
    LocalDateTime dueDate;
    
    @DecimalMin(value = "0.0", message = "Max score must be positive")
    BigDecimal maxScore;
    
    SubmissionType submissionType;
    
    HomeworkStatus status;
    
    // Grading configuration
    String gradingRubric;
    
    LocalDateTime gradeReleaseDate;
    
    Boolean autoGrade;
    
    Boolean allowLateSubmissions;
    
    String latePenaltyConfig;
    
    @Min(value = 1, message = "Max attempts must be at least 1")
    Integer maxAttempts;
    
    Boolean anonymousSubmission;
    
    ScoreType scoreType;
    
    // Submission window
    LocalDateTime submissionWindowStart;
    
    LocalDateTime submissionWindowEnd;
    
    // File upload configuration
    List<String> allowedFileTypes;
    
    @Min(value = 1, message = "Max file size must be at least 1 MB")
    Integer maxFileSizeMB;
    
    // Advanced features
    Boolean enablePlagiarismCheck;
    
    String plagiarismProvider;
    
    Boolean peerReviewEnabled;
    
    String peerReviewConfig;
    
    Boolean groupAssignment;
    
    List<String> groupIds;
    
    Boolean resubmissionAllowed;
    
    // Additional metadata
    String instructions;
    
    @Min(value = 1, message = "Estimated duration must be positive")
    Integer estimatedDurationMinutes;
    
    List<String> tags;
}