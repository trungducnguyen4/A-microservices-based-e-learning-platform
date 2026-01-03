package org.tduc.homeworkservice1.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "submission_comment")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionComment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Column(nullable = false)
    String submissionId;
    
    @Column(nullable = false)
    String commentBy;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    String content;
    
    @Column
    String commentType; // FEEDBACK, QUESTION, CORRECTION, etc.
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;
    
    @Column
    @Builder.Default
    Boolean isPrivate = false;
}