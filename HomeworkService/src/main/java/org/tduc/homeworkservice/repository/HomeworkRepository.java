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
        // Find all homeworks assigned to student (không filter active)
        @Query("SELECT h FROM Homework h WHERE (h.assignedTo IS NULL OR h.assignedTo LIKE CONCAT('%', :studentId, '%')) ORDER BY h.dueDate ASC")
        List<Homework> findAllHomeworksForStudent(@Param("studentId") String studentId);
    
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
    @Query("SELECT h FROM Homework h WHERE h.courseId = :courseId AND (h.assignedTo IS NULL OR h.assignedTo LIKE CONCAT('%', :studentId, '%'))")
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
    
    // Additional methods needed for compilation errors
    
    // Find by title or description containing (for search)
    @Query("SELECT h FROM Homework h WHERE LOWER(h.title) LIKE LOWER(CONCAT('%', :title, '%')) OR LOWER(h.description) LIKE LOWER(CONCAT('%', :description, '%'))")
    Page<Homework> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(@Param("title") String title, @Param("description") String description, Pageable pageable);
    
    // Find active homeworks for student (published, not overdue, and assigned to the student or unassigned)
    @Query("SELECT h FROM Homework h WHERE h.status = 'PUBLISHED' AND h.dueDate > :currentTime AND (h.assignedTo IS NULL OR h.assignedTo LIKE CONCAT('%', :studentId, '%')) ORDER BY h.dueDate ASC")
    List<Homework> findActiveHomeworksForStudent(@Param("studentId") String studentId, @Param("currentTime") LocalDateTime currentTime);
    
    // Find overdue homeworks
    @Query("SELECT h FROM Homework h WHERE h.courseId = :courseId AND h.status = 'PUBLISHED' AND h.dueDate < :currentTime")
    List<Homework> findOverdueHomeworks(@Param("courseId") String courseId, @Param("currentTime") LocalDateTime currentTime);
    
    // Count by course ID
    Long countByCourseId(String courseId);
}