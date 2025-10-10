package org.tduc.homeworkservice.dto.response;

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
public class HomeworkResponse {
    
    String id;
    String title;
    String description;
    String courseId;
    String classId;
    List<String> assignedStudentIds;
    String assignedGroupId;
    String createdBy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime dueDate;
    BigDecimal maxScore;
    SubmissionType submissionType;
    HomeworkStatus status;
    
    // Grading configuration
    String gradingRubric;
    LocalDateTime gradeReleaseDate;
    Boolean autoGrade;
    Boolean allowLateSubmissions;
    String latePenaltyConfig;
    Integer maxAttempts;
    Boolean anonymousSubmission;
    ScoreType scoreType;
    
    // Submission window
    LocalDateTime submissionWindowStart;
    LocalDateTime submissionWindowEnd;
    
    // File upload configuration
    List<String> allowedFileTypes;
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
    Integer estimatedDurationMinutes;
    List<String> tags;
    
    // Statistics
    Integer totalSubmissions;
    Integer gradedSubmissions;
    Integer pendingSubmissions;
    BigDecimal averageScore;
    
    // Attachments
    List<HomeworkAttachmentResponse> attachments;
}