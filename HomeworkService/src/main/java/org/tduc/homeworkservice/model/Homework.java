package org.tduc.homeworkservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "homework")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Homework {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Column(nullable = false, length = 500)
    String title;
    
    @Column(columnDefinition = "TEXT")
    String description;
    
    @Column(nullable = false)
    String courseId;
    
    @Column
    String classId;
    
    // JSON array of student IDs or group ID
    @Column(columnDefinition = "JSON")
    String assignedTo;
    
    @Column(nullable = false)
    String createdBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    LocalDateTime updatedAt;
    
    @Column(nullable = false)
    LocalDateTime dueDate;
    
    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal maxScore;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    SubmissionType submissionType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    HomeworkStatus status;
    
    // Grading configuration
    @Column(columnDefinition = "JSON")
    String gradingRubric;
    
    @Column
    LocalDateTime gradeReleaseDate;
    
    @Column(nullable = false)
    @Builder.Default
    Boolean autoGrade = false;
    
    @Column(nullable = false)
    @Builder.Default
    Boolean allowLateSubmissions = false;
    
    @Column(columnDefinition = "JSON")
    String latePenalty;
    
    @Column
    Integer maxAttempts;
    
    @Column(nullable = false)
    @Builder.Default
    Boolean anonymousSubmission = false;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    ScoreType scoreType = ScoreType.POINTS;
    
    // Submission window
    @Column
    LocalDateTime submissionWindowStart;
    
    @Column
    LocalDateTime submissionWindowEnd;
    
    // File upload configuration
    @Column(columnDefinition = "JSON")
    String allowedFileTypes;
    
    @Column
    Integer maxFileSizeMB;
    
    // Advanced features
    @Column(nullable = false)
    @Builder.Default
    Boolean enablePlagiarismCheck = false;
    
    @Column
    String plagiarismProvider;
    
    @Column(nullable = false)
    @Builder.Default
    Boolean peerReviewEnabled = false;
    
    @Column(columnDefinition = "JSON")
    String peerReviewConfig;
    
    @Column(nullable = false)
    @Builder.Default
    Boolean groupAssignment = false;
    
    @Column(columnDefinition = "JSON")
    String groupIds;
    
    @Column(nullable = false)
    @Builder.Default
    Boolean resubmissionAllowed = false;
    
    // Additional metadata
    @Column
    String instructions;
    
    @Column(columnDefinition = "JSON")
    String attachments;
    
    @Column
    Integer estimatedDurationMinutes;
    
    @Column(columnDefinition = "JSON")
    String tags;
    
    // No relationships - handle at application logic level
    
    // Parse latePenalty JSON string to LatePenaltyConfig object
    public LatePenaltyConfig getLatePenaltyConfig() {
        // Return default penalty config if none is specified
        if (latePenalty == null || latePenalty.isBlank()) {
            return LatePenaltyConfig.builder()
                    .enabled(false)
                    .build();
        }
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return objectMapper.readValue(latePenalty, LatePenaltyConfig.class);
        } catch (Exception e) {
            // Log error and return default
            return LatePenaltyConfig.builder()
                    .enabled(false)
                    .build();
        }
    }
}