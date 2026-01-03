package org.tduc.announcementservice1.dto.request;

import lombok.*;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementCreationRequest {
    @NotBlank
    private String title;

    private String content;

    @NotBlank
    private String courseId;
    private Boolean pinned = false;

    // List of attachment URLs (images, videos, files, links)
    private java.util.List<String> attachments;
}
