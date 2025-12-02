package org.tduc.announcementservice.dto.request;

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
}
