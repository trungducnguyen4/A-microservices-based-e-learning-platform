package org.tduc.homeworkservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.tduc.homeworkservice.model.Homework;
import org.tduc.homeworkservice.model.HomeworkStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, String> {
    
    // Find homework by course
    List<Homework> findByCourseIdOrderByCreatedAtDesc(String courseId);
    
    Page<Homework> findByCourseIdOrderByCreatedAtDesc(String courseId, Pageable pageable);
    
    // Find homework by status
    List<Homework> findByStatusOrderByCreatedAtDesc(HomeworkStatus status);
    
    // Find homework by creator
    List<Homework> findByCreatedByOrderByCreatedAtDesc(String createdBy);
    
    Page<Homework> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);
    
    // Find homework by course and creator
    List<Homework> findByCourseIdAndCreatedByOrderByCreatedAtDesc(String courseId, String createdBy);
    
    // Find homework by title containing (search)
    @Query("SELECT h FROM Homework h WHERE h.courseId = :courseId AND LOWER(h.title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY h.createdAt DESC")
    List<Homework> findByCourseIdAndTitleContainingIgnoreCase(@Param("courseId") String courseId, @Param("keyword") String keyword);
    
    // Find homework due between dates
    @Query("SELECT h FROM Homework h WHERE h.courseId = :courseId AND h.dueDate BETWEEN :startDate AND :endDate ORDER BY h.dueDate ASC")
    List<Homework> findByCourseIdAndDueDateBetween(@Param("courseId") String courseId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find overdue homework
    @Query("SELECT h FROM Homework h WHERE h.status = :status AND h.dueDate < :currentTime ORDER BY h.dueDate ASC")
    List<Homework> findOverdueHomework(@Param("status") HomeworkStatus status, @Param("currentTime") LocalDateTime currentTime);
    
    // Find homework assigned to student
    @Query("SELECT h FROM Homework h WHERE h.courseId = :courseId AND (h.assignedTo IS NULL OR JSON_CONTAINS(h.assignedTo, JSON_QUOTE(:studentId)))")
    List<Homework> findHomeworkAssignedToStudent(@Param("courseId") String courseId, @Param("studentId") String studentId);
    
    // Count homework by status and course
    @Query("SELECT COUNT(h) FROM Homework h WHERE h.courseId = :courseId AND h.status = :status")
    Long countByCourseIdAndStatus(@Param("courseId") String courseId, @Param("status") HomeworkStatus status);
    
    // Find homework by multiple statuses
    List<Homework> findByCourseIdAndStatusInOrderByCreatedAtDesc(String courseId, List<HomeworkStatus> statuses);
    
    // Find homework created in date range
    List<Homework> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Count by creator
    Long countByCreatedBy(String createdBy);
    
    // Find published homework
    @Query("SELECT h FROM Homework h WHERE h.status = 'PUBLISHED' AND h.courseId = :courseId ORDER BY h.dueDate ASC")
    List<Homework> findPublishedHomeworkByCourse(@Param("courseId") String courseId);
}