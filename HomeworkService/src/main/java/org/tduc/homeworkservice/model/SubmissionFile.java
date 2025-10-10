package org.tduc.homeworkservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "submission_file")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    Submission submission;
    
    @Column(nullable = false)
    String fileName;
    
    @Column(nullable = false)
    String originalName;
    
    @Column(nullable = false)
    String filePath;
    
    @Column
    String mimeType;
    
    @Column
    Long fileSize;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    LocalDateTime uploadedAt;
    
    @Column
    Integer fileOrder;
}