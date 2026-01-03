package org.tduc.homeworkservice1.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeworkAttachmentResponse {
    
    String id;
    String fileName;
    String originalName;
    String filePath;
    String mimeType;
    Long fileSize;
    String description;
    LocalDateTime createdAt;
    String uploadedBy;
}