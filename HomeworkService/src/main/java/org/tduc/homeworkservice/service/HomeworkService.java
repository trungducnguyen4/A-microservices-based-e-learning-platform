package org.tduc.homeworkservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.tduc.homeworkservice.dto.request.HomeworkCreationRequest;
import org.tduc.homeworkservice.dto.request.HomeworkUpdateRequest;
import org.tduc.homeworkservice.dto.response.HomeworkResponse;
import org.tduc.homeworkservice.exception.AppException;
import org.tduc.homeworkservice.exception.ErrorCode;
import org.tduc.homeworkservice.mapper.HomeworkMapper;
import org.tduc.homeworkservice.util.AuthContextUtil;
import org.tduc.homeworkservice.model.*;
import org.tduc.homeworkservice.repository.HomeworkRepository;
import org.tduc.homeworkservice.repository.HomeworkAttachmentRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HomeworkService {
    
    private final HomeworkRepository homeworkRepository;
    private final HomeworkAttachmentRepository attachmentRepository;
    private final HomeworkMapper homeworkMapper;
    private final AuthContextUtil authContextUtil;

    /**
     * Get all homeworks
     */
    public List<HomeworkResponse> getAllHomeworks() {
        log.info("Getting all homeworks");
        List<Homework> homeworks = homeworkRepository.findAll();
        return homeworks.stream()
            .map(homeworkMapper::toHomeworkResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Create a new homework assignment
     */
    public HomeworkResponse createHomework(HomeworkCreationRequest request) {
        log.info("Creating homework with title: {}", request.getTitle());
        
        // Validate due date
        if (request.getDueDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_DUE_DATE);
        }

        // Validate submission window if provided
        if (request.getSubmissionWindowStart() != null && request.getSubmissionWindowEnd() != null) {
            if (request.getSubmissionWindowStart().isAfter(request.getSubmissionWindowEnd())) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Submission window start must be before end");
            }
        }

        Homework homework = homeworkMapper.toHomework(request);
        // Set createdBy from API Gateway forwarded headers (X-User-Id or username).
        String createdBy = authContextUtil.getCurrentUserIdRaw();
        if (createdBy == null) {
            Long numeric = authContextUtil.getCurrentUserId();
            if (numeric != null) createdBy = String.valueOf(numeric);
            else createdBy = authContextUtil.getCurrentUsername();
        }
        if (createdBy == null || createdBy.isBlank()) {
            createdBy = "system"; // fallback to a non-null value to satisfy DB constraint
        }
        homework.setCreatedBy(createdBy);
        homework.setCreatedAt(LocalDateTime.now());
        homework.setUpdatedAt(LocalDateTime.now());
        // Respect requested status (allow creating as PUBLISHED if caller provided it), default to DRAFT
        if (request.getStatus() != null) {
            homework.setStatus(request.getStatus());
        } else {
            homework.setStatus(HomeworkStatus.DRAFT);
        }
        
        Homework savedHomework = homeworkRepository.save(homework);
        log.info("Created homework with ID: {}", savedHomework.getId());
        
        return homeworkMapper.toHomeworkResponse(savedHomework);
    }

    /**
     * Update an existing homework assignment
     */
    public HomeworkResponse updateHomework(String id, HomeworkUpdateRequest request) {
        log.info("Updating homework with ID: {}", id);
        
        Homework homework = homeworkRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
        
        // Prevent modification if homework is published and has submissions
        if (homework.getStatus() == HomeworkStatus.PUBLISHED) {
            // You might want to add logic to check if there are submissions
            // For now, allow updates to published homework but log warning
            log.warn("Updating published homework: {}", id);
        }
        
        // Update fields if provided
        if (request.getTitle() != null) {
            homework.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            homework.setDescription(request.getDescription());
        }
        if (request.getDueDate() != null) {
            if (request.getDueDate().isBefore(LocalDateTime.now())) {
                throw new AppException(ErrorCode.INVALID_DUE_DATE);
            }
            homework.setDueDate(request.getDueDate());
        }
        if (request.getMaxScore() != null) {
            homework.setMaxScore(request.getMaxScore());
        }
        if (request.getStatus() != null) {
            homework.setStatus(request.getStatus());
        }
        if (request.getAllowLateSubmissions() != null) {
            homework.setAllowLateSubmissions(request.getAllowLateSubmissions());
        }
        if (request.getResubmissionAllowed() != null) {
            homework.setResubmissionAllowed(request.getResubmissionAllowed());
        }
        if (request.getMaxAttempts() != null) {
            homework.setMaxAttempts(request.getMaxAttempts());
        }
        if (request.getSubmissionType() != null) {
            homework.setSubmissionType(request.getSubmissionType());
        }
        if (request.getScoreType() != null) {
            homework.setScoreType(request.getScoreType());
        }
        if (request.getInstructions() != null) {
            homework.setInstructions(request.getInstructions());
        }
        if (request.getEstimatedDurationMinutes() != null) {
            homework.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        }
        
        homework.setUpdatedAt(LocalDateTime.now());
        
        Homework savedHomework = homeworkRepository.save(homework);
        log.info("Updated homework with ID: {}", savedHomework.getId());
        
        return homeworkMapper.toHomeworkResponse(savedHomework);
    }

    /**
     * Get homework by ID
     */
    @Transactional(readOnly = true)
    public HomeworkResponse getHomework(String id) {
        log.info("Getting homework with ID: {}", id);
        
        Homework homework = homeworkRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
        
        return homeworkMapper.toHomeworkResponse(homework);
    }

    /**
     * Get all homeworks for a course with pagination
     */
    @Transactional(readOnly = true)
    public Page<HomeworkResponse> getHomeworksByCourse(String courseId, int page, int size) {
        log.info("Getting homeworks for course: {}, page: {}, size: {}", courseId, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Homework> homeworks = homeworkRepository.findByCourseIdOrderByCreatedAtDesc(courseId, pageable);
        
        return homeworks.map(homeworkMapper::toHomeworkResponse);
    }

    /**
     * Get homeworks created by a specific teacher
     */
    @Transactional(readOnly = true)
    public Page<HomeworkResponse> getHomeworksByCreator(String createdBy, int page, int size) {
        log.info("Getting homeworks created by: {}, page: {}, size: {}", createdBy, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Homework> homeworks = homeworkRepository.findByCreatedByOrderByCreatedAtDesc(createdBy, pageable);
        
        return homeworks.map(homeworkMapper::toHomeworkResponse);
    }

    /**
     * Search homeworks by keyword
     */
    @Transactional(readOnly = true)
    public Page<HomeworkResponse> searchHomeworks(String keyword, int page, int size) {
        log.info("Searching homeworks with keyword: {}, page: {}, size: {}", keyword, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Homework> homeworks = homeworkRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            keyword, keyword, pageable);
        
        return homeworks.map(homeworkMapper::toHomeworkResponse);
    }

    /**
     * Delete homework and its associated data
     */
    public void deleteHomework(String id) {
        log.info("Deleting homework with ID: {}", id);
        
        Homework homework = homeworkRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
        
        // Check if homework has submissions - you might want to prevent deletion
        // For now, we'll allow deletion but log a warning
        
        // Delete associated attachments first
        attachmentRepository.deleteByHomeworkId(id);
        
        homeworkRepository.delete(homework);
        log.info("Deleted homework with ID: {}", id);
    }

    /**
     * Publish homework (make it available to students)
     */
    public HomeworkResponse publishHomework(String id) {
        log.info("Publishing homework with ID: {}", id);
        
        Homework homework = homeworkRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
        
        // Validate homework is ready for publishing
        if (homework.getDueDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_DUE_DATE, "Cannot publish homework with past due date");
        }
        
        homework.setStatus(HomeworkStatus.PUBLISHED);
        homework.setUpdatedAt(LocalDateTime.now());
        
        Homework savedHomework = homeworkRepository.save(homework);
        log.info("Published homework with ID: {}", savedHomework.getId());
        
        return homeworkMapper.toHomeworkResponse(savedHomework);
    }

    /**
     * Get active homeworks for a student (published and not overdue)
     */
    @Transactional(readOnly = true)
    public List<HomeworkResponse> getActiveHomeworksForStudent(String studentId) {
        log.info("Getting active homeworks for student: {}", studentId);
        
        LocalDateTime now = LocalDateTime.now();
        List<Homework> homeworks = homeworkRepository.findActiveHomeworksForStudent(studentId, now);
        
        return homeworks.stream()
            .map(homeworkMapper::toHomeworkResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get overdue homeworks for a course
     */
    @Transactional(readOnly = true)
    public List<HomeworkResponse> getOverdueHomeworks(String courseId) {
        log.info("Getting overdue homeworks for course: {}", courseId);
        
        LocalDateTime now = LocalDateTime.now();
        List<Homework> homeworks = homeworkRepository.findOverdueHomeworks(courseId, now);
        
        return homeworks.stream()
            .map(homeworkMapper::toHomeworkResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get homework statistics for a course
     */
    @Transactional(readOnly = true)
    public HomeworkStatsResponse getHomeworkStats(String courseId) {
        log.info("Getting homework statistics for course: {}", courseId);
        
        long totalHomeworks = homeworkRepository.countByCourseId(courseId);
        long publishedHomeworks = homeworkRepository.countByCourseIdAndStatus(courseId, HomeworkStatus.PUBLISHED);
        long draftHomeworks = homeworkRepository.countByCourseIdAndStatus(courseId, HomeworkStatus.DRAFT);
        
        LocalDateTime now = LocalDateTime.now();
        long overdueHomeworks = homeworkRepository.findOverdueHomeworks(courseId, now).size();
        
        return HomeworkStatsResponse.builder()
            .totalHomeworks(totalHomeworks)
            .publishedHomeworks(publishedHomeworks)
            .draftHomeworks(draftHomeworks)
            .overdueHomeworks(overdueHomeworks)
            .build();
    }

    /**
     * Bulk update homework status
     */
    public void bulkUpdateStatus(List<String> homeworkIds, HomeworkStatus status) {
        log.info("Bulk updating status for {} homeworks to {}", homeworkIds.size(), status);
        
        List<Homework> homeworks = homeworkRepository.findAllById(homeworkIds);
        homeworks.forEach(homework -> {
            homework.setStatus(status);
            homework.setUpdatedAt(LocalDateTime.now());
        });
        
        homeworkRepository.saveAll(homeworks);
        log.info("Bulk updated {} homeworks", homeworks.size());
    }
    
    // Inner class for statistics response
    @lombok.Data
    @lombok.Builder
    public static class HomeworkStatsResponse {
        private long totalHomeworks;
        private long publishedHomeworks;
        private long draftHomeworks;
        private long overdueHomeworks;
    }
}