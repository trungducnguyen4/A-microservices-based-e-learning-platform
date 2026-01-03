package org.tduc.homeworkservice1.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.homeworkservice1.model.SubmissionStatus;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionCreationRequest {
    
    @NotBlank(message = "Homework ID is required")
    String homeworkId;
    
    @NotBlank(message = "Student ID is required")
    String studentId;
    
    String groupId;
    
    @Size(max = 10000, message = "Content must not exceed 10000 characters")
    String content;
    
    List<String> attachmentIds;
    
    @Builder.Default
    SubmissionStatus status = SubmissionStatus.DRAFT;
    
    String ipAddress;
    
    String userAgent;
}