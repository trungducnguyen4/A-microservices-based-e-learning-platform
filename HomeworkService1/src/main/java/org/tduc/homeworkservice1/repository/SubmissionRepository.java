package org.tduc.homeworkservice1.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.tduc.homeworkservice1.model.Submission;
import org.tduc.homeworkservice1.model.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, String> {
    
    // Find submissions by homework
    List<Submission> findByHomeworkIdOrderBySubmittedAtDesc(String homeworkId);
    
    Page<Submission> findByHomeworkIdOrderBySubmittedAtDesc(String homeworkId, Pageable pageable);
    
    // Find submissions by student
    List<Submission> findByStudentIdOrderBySubmittedAtDesc(String studentId);
    
    Page<Submission> findByStudentIdOrderBySubmittedAtDesc(String studentId, Pageable pageable);
    
    // Find submission by homework and student
    Optional<Submission> findByHomeworkIdAndStudentId(String homeworkId, String studentId);
    
    // Find latest submission by homework and student
    @Query("SELECT s FROM Submission s WHERE s.homeworkId = :homeworkId AND s.studentId = :studentId ORDER BY s.attemptNumber DESC LIMIT 1")
    Optional<Submission> findLatestSubmissionByHomeworkAndStudent(@Param("homeworkId") String homeworkId, @Param("studentId") String studentId);
    
    // Find submissions by status
    List<Submission> findByStatusOrderBySubmittedAtDesc(SubmissionStatus status);
    
    // Find submissions by homework and status
    List<Submission> findByHomeworkIdAndStatusOrderBySubmittedAtDesc(String homeworkId, SubmissionStatus status);
    
    // Count submissions by homework
    Long countByHomeworkId(String homeworkId);
    
    // Count submissions by homework and status
    Long countByHomeworkIdAndStatus(String homeworkId, SubmissionStatus status);
    
    // Count graded submissions by homework
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.homeworkId = :homeworkId AND s.status = 'GRADED'")
    Long countGradedSubmissionsByHomework(@Param("homeworkId") String homeworkId);
    
    // Find late submissions
    @Query("SELECT s FROM Submission s WHERE s.homeworkId = :homeworkId AND s.isLate = true ORDER BY s.submittedAt DESC")
    List<Submission> findLateSubmissionsByHomework(@Param("homeworkId") String homeworkId);
    
    // Find submissions needing grading
    @Query("SELECT s FROM Submission s WHERE s.status = 'SUBMITTED' AND s.homeworkId = :homeworkId ORDER BY s.submittedAt ASC")
    List<Submission> findSubmissionsNeedingGrading(@Param("homeworkId") String homeworkId);
    
    // Calculate average score for homework
    @Query("SELECT AVG(s.score) FROM Submission s WHERE s.homeworkId = :homeworkId AND s.status = 'GRADED' AND s.score IS NOT NULL")
    Optional<BigDecimal> calculateAverageScoreByHomework(@Param("homeworkId") String homeworkId);
    
    // Find submissions by course - this will need to be done through a service layer join
    // We'll need to first find all homework IDs for the course, then find submissions for those IDs
    @Query("SELECT s FROM Submission s WHERE s.homeworkId IN (SELECT h.id FROM Homework h WHERE h.courseId = :courseId) AND s.studentId = :studentId ORDER BY s.submittedAt DESC")
    List<Submission> findByCourseAndStudent(@Param("courseId") String courseId, @Param("studentId") String studentId);
    
    // Find submissions by date range
    List<Submission> findBySubmittedAtBetweenOrderBySubmittedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find submissions by attempt number
    List<Submission> findByHomeworkIdAndAttemptNumberOrderBySubmittedAtDesc(String homeworkId, Integer attemptNumber);
    
    // Check if student has submitted homework
    boolean existsByHomeworkIdAndStudentId(String homeworkId, String studentId);
    
    // Find submissions with plagiarism check results
    @Query("SELECT s FROM Submission s WHERE s.homeworkId = :homeworkId AND s.plagiarismResult IS NOT NULL ORDER BY s.similarityScore DESC")
    List<Submission> findSubmissionsWithPlagiarismResults(@Param("homeworkId") String homeworkId);
    
    // Find group submissions
    List<Submission> findByGroupIdOrderBySubmittedAtDesc(String groupId);
    
    // Additional methods needed for compilation errors
    
    // Find submissions by homework ID and student ID ordered by submitted date descending
    List<Submission> findByHomeworkIdAndStudentIdOrderBySubmittedAtDesc(String homeworkId, String studentId);
    
    // Find submissions by homework ID and status
    List<Submission> findByHomeworkIdAndStatus(String homeworkId, SubmissionStatus status);
    
    // Count submissions by homework ID and isLate flag
    Long countByHomeworkIdAndIsLate(String homeworkId, boolean isLate);
}