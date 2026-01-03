package org.tduc.homeworkservice1.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.homeworkservice1.model.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionResponse {
    
    String id;
    String homeworkId;
    String studentId;
    String groupId;
    String content;
    SubmissionStatus status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime submittedAt;
    LocalDateTime gradedAt;
    
    // Grading information
    BigDecimal score;
    BigDecimal percentage;
    String letterGrade;
    String feedback;
    String gradedBy;
    
    // Submission metadata
    Integer attemptNumber;
    Boolean isLate;
    Integer minutesLate;
    BigDecimal latePenaltyApplied;
    
    // Plagiarism check results
    BigDecimal similarityScore;
    String plagiarismResult;
    
    // Files and comments
    List<SubmissionFileResponse> files;
    List<org.tduc.homeworkservice.dto.response.SubmissionCommentResponse> comments;
}