package org.tduc.announcementservice1.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "announcement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {
    @Id
    private String id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "course_id")
    private String courseId;

    @Column(name = "created_by")
    private String createdBy;

    private ZonedDateTime createdAt;

    private ZonedDateTime updatedAt;

    private Boolean pinned = false;

    @ElementCollection
    @CollectionTable(name = "announcement_attachments", joinColumns = @JoinColumn(name = "announcement_id"))
    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private java.util.List<String> attachments;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = ZonedDateTime.now();
        this.updatedAt = this.createdAt;
        if (this.pinned == null) this.pinned = false;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }
}
