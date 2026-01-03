package org.tduc.homeworkservice1.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.homeworkservice1.model.HomeworkStatus;
import org.tduc.homeworkservice1.model.ScoreType;
import org.tduc.homeworkservice1.model.SubmissionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeworkCreationRequest {
    
    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    String title;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    String description;
    
    @NotBlank(message = "Course ID is required")
    String courseId;
    
    String classId;
    
    List<String> assignedStudentIds;
    
    String assignedGroupId;
    
    @NotNull(message = "Due date is required")
    @Future(message = "Due date must be in the future")
    LocalDateTime dueDate;
    
    @NotNull(message = "Max score is required")
    @DecimalMin(value = "0.0", message = "Max score must be positive")
    BigDecimal maxScore;
    
    @NotNull(message = "Submission type is required")
    SubmissionType submissionType;
    
    @Builder.Default
    HomeworkStatus status = HomeworkStatus.DRAFT;
    
    // Grading configuration
    String gradingRubric;
    
    LocalDateTime gradeReleaseDate;
    
    @Builder.Default
    Boolean autoGrade = false;
    
    @Builder.Default
    Boolean allowLateSubmissions = false;
    
    String latePenaltyConfig;
    
    @Min(value = 1, message = "Max attempts must be at least 1")
    Integer maxAttempts;
    
    @Builder.Default
    Boolean anonymousSubmission = false;
    
    @Builder.Default
    ScoreType scoreType = ScoreType.POINTS;
    
    // Submission window
    LocalDateTime submissionWindowStart;
    
    LocalDateTime submissionWindowEnd;
    
    // File upload configuration
    List<String> allowedFileTypes;
    
    @Min(value = 1, message = "Max file size must be at least 1 MB")
    Integer maxFileSizeMB;
    
    // Advanced features
    @Builder.Default
    Boolean enablePlagiarismCheck = false;
    
    String plagiarismProvider;
    
    @Builder.Default
    Boolean peerReviewEnabled = false;
    
    String peerReviewConfig;
    
    @Builder.Default
    Boolean groupAssignment = false;
    
    List<String> groupIds;
    
    @Builder.Default
    Boolean resubmissionAllowed = false;
    
    // Additional metadata
    String instructions;
    
    @Min(value = 1, message = "Estimated duration must be positive")
    Integer estimatedDurationMinutes;
    
    List<String> tags;
}