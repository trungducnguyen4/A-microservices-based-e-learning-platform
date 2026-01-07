package org.tduc.homeworkservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.tduc.homeworkservice.dto.request.SubmissionCreationRequest;
import org.tduc.homeworkservice.dto.request.GradingRequest;
import org.tduc.homeworkservice.dto.response.SubmissionResponse;
import org.tduc.homeworkservice.exception.AppException;
import org.tduc.homeworkservice.exception.ErrorCode;
import org.tduc.homeworkservice.mapper.SubmissionMapper;
import org.tduc.homeworkservice.model.*;
import org.tduc.homeworkservice.repository.HomeworkRepository;
import org.tduc.homeworkservice.repository.SubmissionRepository;
import org.tduc.homeworkservice.repository.SubmissionFileRepository;
import org.tduc.homeworkservice.repository.SubmissionCommentRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SubmissionService {
    
    private final SubmissionRepository submissionRepository;
    private final HomeworkRepository homeworkRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final SubmissionCommentRepository submissionCommentRepository;
    private final SubmissionMapper submissionMapper;

    /**
     * Create a new submission for homework
     */
    public SubmissionResponse createSubmission(SubmissionCreationRequest request) {
        log.info("Creating submission for homework: {} by student: {}", request.getHomeworkId(), request.getStudentId());
        
        // Validate homework exists and is published
        Homework homework = homeworkRepository.findById(request.getHomeworkId())
            .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
        
        if (homework.getStatus() != HomeworkStatus.PUBLISHED) {
            throw new AppException(ErrorCode.HOMEWORK_NOT_PUBLISHED);
        }
        
        // Check submission window
        LocalDateTime now = LocalDateTime.now();
        if (homework.getSubmissionWindowStart() != null && now.isBefore(homework.getSubmissionWindowStart())) {
            throw new AppException(ErrorCode.SUBMISSION_WINDOW_NOT_OPEN);
        }
        if (homework.getSubmissionWindowEnd() != null && now.isAfter(homework.getSubmissionWindowEnd())) {
            throw new AppException(ErrorCode.SUBMISSION_WINDOW_CLOSED);
        }
        
        // Check if submission is before due date
        boolean isLate = now.isAfter(homework.getDueDate());
        
        if (isLate && !homework.getAllowLateSubmissions()) {
            throw new AppException(ErrorCode.LATE_SUBMISSION_NOT_ALLOWED);
        }
        
        // Check for existing submissions and resubmission policy
        List<Submission> existingSubmissions = submissionRepository.findByHomeworkIdAndStudentIdOrderBySubmittedAtDesc(
            request.getHomeworkId(), request.getStudentId());
        
        if (!existingSubmissions.isEmpty()) {
            if (!homework.getResubmissionAllowed()) {
                throw new AppException(ErrorCode.RESUBMISSION_NOT_ALLOWED);
            }
            
            // Check max attempts
            if (existingSubmissions.size() >= homework.getMaxAttempts()) {
                throw new AppException(ErrorCode.MAX_ATTEMPTS_EXCEEDED);
            }
        }

        Submission submission = submissionMapper.toSubmission(request);
        submission.setSubmittedAt(now);
        submission.setIsLate(isLate);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setAttemptNumber(existingSubmissions.size() + 1);
        
        // Apply late penalty if applicable
        if (isLate && homework.getLatePenaltyConfig().getEnabled()) {
            submission.setLatePenaltyApplied(homework.getLatePenaltyConfig().getPercentagePerDay());
            // Penalty calculation logic is implemented in applyLatePenalty method
        } else {
            submission.setLatePenaltyApplied(null);
        }
        
        Submission savedSubmission = submissionRepository.save(submission);
        log.info("Created submission with ID: {}", savedSubmission.getId());
        
        return submissionMapper.toSubmissionResponse(savedSubmission);
    }

    /**
     * Grade a submission
     */
    public SubmissionResponse gradeSubmission(String submissionId, GradingRequest request) {
        log.info("Grading submission: {} with score: {}", submissionId, request.getScore());
        
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));
        
        Homework homework = homeworkRepository.findById(submission.getHomeworkId())
            .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
        
        // Validate score range
        if (request.getScore().compareTo(BigDecimal.ZERO) < 0 || 
            request.getScore().compareTo(homework.getMaxScore()) > 0) {
            throw new AppException(ErrorCode.INVALID_SCORE);
        }
        
        // Apply late penalty if applicable
        BigDecimal finalScore = request.getScore();
        if (submission.getIsLate() && submission.getLatePenaltyApplied() != null) {
            // Apply late penalty using the stored penalty rate
            finalScore = applyLatePenalty(finalScore, submission.getSubmittedAt(), homework.getDueDate());
        }
        
        submission.setScore(finalScore);
        submission.setOriginalScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setGradedBy(request.getGradedBy());
        submission.setGradedAt(LocalDateTime.now());
        submission.setStatus(SubmissionStatus.GRADED);
        
        // Store rubric scores if provided
        if (request.getRubricScores() != null) {
            submission.setRubricScores(request.getRubricScores());
        }
        
        // Store private notes if provided
        if (request.getPrivateNotes() != null) {
            submission.setPrivateNotes(request.getPrivateNotes());
        }
        
        Submission savedSubmission = submissionRepository.save(submission);
        log.info("Graded submission with ID: {} - Final Score: {}", savedSubmission.getId(), finalScore);
        
        return submissionMapper.toSubmissionResponse(savedSubmission);
    }

    /**
     * Get submission by ID
     */
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(String id) {
        log.info("Getting submission with ID: {}", id);
        
        Submission submission = submissionRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));
        
        return submissionMapper.toSubmissionResponse(submission);
    }

    /**
     * Get all submissions for a homework with pagination
     */
    @Transactional(readOnly = true)
    public Page<SubmissionResponse> getSubmissionsByHomework(String homeworkId, int page, int size) {
        log.info("Getting submissions for homework: {}, page: {}, size: {}", homeworkId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<Submission> submissions = submissionRepository.findByHomeworkIdOrderBySubmittedAtDesc(homeworkId, pageable);
        // Nếu không có submission nào thì trả về trang rỗng, không throw exception
        if (submissions == null || submissions.isEmpty()) {
            return Page.empty(pageable);
        }
        return submissions.map(submissionMapper::toSubmissionResponse);
    }

    /**
     * Get all submissions by a student with pagination
     */
    @Transactional(readOnly = true)
    public Page<SubmissionResponse> getSubmissionsByStudent(String studentId, int page, int size) {
        log.info("Getting submissions for student: {}, page: {}, size: {}", studentId, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<Submission> submissions = submissionRepository.findByStudentIdOrderBySubmittedAtDesc(studentId, pageable);
        
        return submissions.map(submissionMapper::toSubmissionResponse);
    }

    /**
     * Get pending submissions for grading
     */
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getPendingSubmissions(String homeworkId) {
        log.info("Getting pending submissions for homework: {}", homeworkId);
        
        List<Submission> submissions = submissionRepository.findByHomeworkIdAndStatus(homeworkId, SubmissionStatus.SUBMITTED);
        
        return submissions.stream()
            .map(submissionMapper::toSubmissionResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get student's latest submission for a homework
     */
    @Transactional(readOnly = true)
    public Optional<SubmissionResponse> getLatestSubmission(String homeworkId, String studentId) {
        log.info("Getting latest submission for homework: {} by student: {}", homeworkId, studentId);
        
        return submissionRepository.findByHomeworkIdAndStudentId(homeworkId, studentId)
            .map(submissionMapper::toSubmissionResponse);
    }

    /**
     * Get submission statistics for a homework
     */
    @Transactional(readOnly = true)
    public SubmissionStatsResponse getSubmissionStats(String homeworkId) {
        log.info("Getting submission statistics for homework: {}", homeworkId);
        
        long totalSubmissions = submissionRepository.countByHomeworkId(homeworkId);
        long gradedSubmissions = submissionRepository.countByHomeworkIdAndStatus(homeworkId, SubmissionStatus.GRADED);
        long pendingSubmissions = submissionRepository.countByHomeworkIdAndStatus(homeworkId, SubmissionStatus.SUBMITTED);
        long lateSubmissions = submissionRepository.countByHomeworkIdAndIsLate(homeworkId, true);
        
        // Calculate average score for graded submissions
        List<Submission> gradedSubmissionsList = submissionRepository.findByHomeworkIdAndStatus(homeworkId, SubmissionStatus.GRADED);
        BigDecimal averageScore = gradedSubmissionsList.stream()
            .filter(s -> s.getScore() != null)
            .map(Submission::getScore)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(gradedSubmissionsList.size(), 1)), 2, BigDecimal.ROUND_HALF_UP);
        
        return SubmissionStatsResponse.builder()
            .totalSubmissions(totalSubmissions)
            .gradedSubmissions(gradedSubmissions)
            .pendingSubmissions(pendingSubmissions)
            .lateSubmissions(lateSubmissions)
            .averageScore(averageScore)
            .build();
    }

    /**
     * Delete submission and associated files
     */
    public void deleteSubmission(String id) {
        log.info("Deleting submission with ID: {}", id);
        
        Submission submission = submissionRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));
        
        // Delete associated files and comments first
        submissionFileRepository.deleteBySubmissionId(id);
        submissionCommentRepository.deleteBySubmissionId(id);
        
        submissionRepository.delete(submission);
        log.info("Deleted submission with ID: {}", id);
    }

    /**
     * Update submission status
     */
    public SubmissionResponse updateSubmissionStatus(String submissionId, SubmissionStatus status) {
        log.info("Updating submission {} status to {}", submissionId, status);
        
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));
        
        submission.setStatus(status);
        submission.setUpdatedAt(LocalDateTime.now());
        
        Submission savedSubmission = submissionRepository.save(submission);
        
        return submissionMapper.toSubmissionResponse(savedSubmission);
    }

    /**
     * Bulk grade submissions
     */
    public List<SubmissionResponse> bulkGradeSubmissions(List<String> submissionIds, GradingRequest gradingTemplate) {
        log.info("Bulk grading {} submissions", submissionIds.size());
        
        List<Submission> submissions = submissionRepository.findAllById(submissionIds);
        
        submissions.forEach(submission -> {
            Homework homework = homeworkRepository.findById(submission.getHomeworkId())
                .orElseThrow(() -> new AppException(ErrorCode.HOMEWORK_NOT_FOUND));
            
            // Apply the same grading template to all submissions
            BigDecimal finalScore = gradingTemplate.getScore();
            if (submission.getIsLate() && submission.getLatePenaltyApplied() != null) {
                finalScore = applyLatePenalty(finalScore, submission.getSubmittedAt(), homework.getDueDate());
            }
            
            submission.setScore(finalScore);
            submission.setOriginalScore(gradingTemplate.getScore());
            submission.setFeedback(gradingTemplate.getFeedback());
            submission.setGradedBy(gradingTemplate.getGradedBy());
            submission.setGradedAt(LocalDateTime.now());
            submission.setStatus(SubmissionStatus.GRADED);
        });
        
        List<Submission> savedSubmissions = submissionRepository.saveAll(submissions);
        
        return savedSubmissions.stream()
            .map(submissionMapper::toSubmissionResponse)
            .collect(Collectors.toList());
    }

    /**
     * Apply late penalty to score
     */
    private BigDecimal applyLatePenalty(BigDecimal originalScore, LocalDateTime submittedAt, LocalDateTime dueDate) {
        // Example penalty: 10% per day late
        long daysLate = java.time.temporal.ChronoUnit.DAYS.between(dueDate.toLocalDate(), submittedAt.toLocalDate());
        if (daysLate <= 0) {
            return originalScore;
        }
        
        BigDecimal penaltyPercentage = BigDecimal.valueOf(0.10); // 10% per day
        BigDecimal totalPenalty = penaltyPercentage.multiply(BigDecimal.valueOf(daysLate));
        
        // Cap penalty at 50%
        if (totalPenalty.compareTo(BigDecimal.valueOf(0.50)) > 0) {
            totalPenalty = BigDecimal.valueOf(0.50);
        }
        
        BigDecimal penaltyAmount = originalScore.multiply(totalPenalty);
        BigDecimal finalScore = originalScore.subtract(penaltyAmount);
        
        // Ensure score doesn't go below 0
        return finalScore.max(BigDecimal.ZERO);
    }
    
    // Inner class for statistics response
    @lombok.Data
    @lombok.Builder
    public static class SubmissionStatsResponse {
        private long totalSubmissions;
        private long gradedSubmissions;
        private long pendingSubmissions;
        private long lateSubmissions;
        private BigDecimal averageScore;
    }
}