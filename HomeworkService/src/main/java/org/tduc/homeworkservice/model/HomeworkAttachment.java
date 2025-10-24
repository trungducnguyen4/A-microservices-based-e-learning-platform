package org.tduc.homeworkservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "homework_attachment")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeworkAttachment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Column(nullable = false)
    String homeworkId;
    
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
    
    @Column
    String description;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    LocalDateTime updatedAt;
    
    @Column(nullable = false)
    String uploadedBy;
}