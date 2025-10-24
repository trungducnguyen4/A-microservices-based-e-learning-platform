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
@Table(name = "submission")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Column(nullable = false)
    String homeworkId;
    
    @Column(nullable = false)
    String studentId;
    
    @Column
    String groupId;
    
    @Column(columnDefinition = "TEXT")
    String content;
    
    @Column(columnDefinition = "JSON")
    String attachments;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    SubmissionStatus status = SubmissionStatus.NOT_SUBMITTED;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    LocalDateTime updatedAt;
    
    @Column
    LocalDateTime submittedAt;
    
    @Column
    LocalDateTime gradedAt;
    
    // Grading information
    @Column(precision = 10, scale = 2)
    BigDecimal score;
    
    @Column(precision = 5, scale = 2)
    BigDecimal percentage;
    
    @Column
    String letterGrade;
    
    @Column(columnDefinition = "TEXT")
    String feedback;
    
    @Column
    String gradedBy;
    
    // Submission metadata
    @Column
    @Builder.Default
    Integer attemptNumber = 1;
    
    @Column
    @Builder.Default
    Boolean isLate = false;
    
    @Column
    Integer minutesLate;
    
    @Column(precision = 5, scale = 2)
    BigDecimal latePenaltyApplied;
    
    @Column
    String ipAddress;
    
    @Column
    String userAgent;
    
    // Plagiarism check results
    @Column(columnDefinition = "JSON")
    String plagiarismResult;
    
    @Column(precision = 5, scale = 2)
    BigDecimal similarityScore;
    
    // Peer review
    @Column(columnDefinition = "JSON")
    String peerReviewAssignments;
    
    @Column(columnDefinition = "JSON")
    String peerReviewScores;
    
    // No direct relationships - application logic will handle these
    
    // This method is no longer needed as we have a direct homeworkId field
    // Keeping it for backward compatibility with existing code
    public String getHomeworkId() {
        return homeworkId;
    }
    
    // For storing original score before any penalties are applied
    private BigDecimal originalScore;
    
    public void setOriginalScore(BigDecimal originalScore) {
        this.originalScore = originalScore;
    }
    
    public BigDecimal getOriginalScore() {
        return originalScore;
    }
    
    // For storing rubric scores
    private String rubricScores;
    
    public void setRubricScores(String rubricScores) {
        this.rubricScores = rubricScores;
    }
    
    public String getRubricScores() {
        return rubricScores;
    }
    
    // For storing private notes
    private String privateNotes;
    
    public void setPrivateNotes(String privateNotes) {
        this.privateNotes = privateNotes;
    }
    
    public String getPrivateNotes() {
        return privateNotes;
    }
}