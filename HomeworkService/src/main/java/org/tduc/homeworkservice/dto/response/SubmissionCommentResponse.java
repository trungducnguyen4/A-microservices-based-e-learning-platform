package org.tduc.homeworkservice.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionCommentResponse {
    
    String id;
    String commentBy;
    String content;
    String commentType;
    LocalDateTime createdAt;
    Boolean isPrivate;
}