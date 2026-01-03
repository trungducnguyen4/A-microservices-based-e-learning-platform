package org.tduc.announcementservice1.dto.response;

import lombok.*;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementResponse {
    private String id;
    private String title;
    private String content;
    private String courseId;
    private String createdBy;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private Boolean pinned;
    private java.util.List<String> attachments;
}
