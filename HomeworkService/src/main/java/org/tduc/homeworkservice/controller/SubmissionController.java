package org.tduc.homeworkservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.homeworkservice.dto.request.ApiResponse;
import org.tduc.homeworkservice.dto.request.SubmissionCreationRequest;
import org.tduc.homeworkservice.dto.request.GradingRequest;
import org.tduc.homeworkservice.dto.response.SubmissionResponse;
import org.tduc.homeworkservice.model.SubmissionStatus;
import org.tduc.homeworkservice.service.SubmissionService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SubmissionController {
    
    private final SubmissionService submissionService;

    /**
     * Create a new submission
     */
    @PostMapping
    public ApiResponse<SubmissionResponse> createSubmission(@RequestBody @Valid SubmissionCreationRequest request) {
        log.info("POST /api/submission - Creating submission for homework: {}", request.getHomeworkId());
        
        SubmissionResponse submission = submissionService.createSubmission(request);
        
        return ApiResponse.<SubmissionResponse>builder()
            .code(HttpStatus.CREATED.value())
            .message("Submission created successfully")
            .result(submission)
            .build();
    }

    /**
     * Grade a submission
     */
    @PostMapping("/{id}/grade")
    public ApiResponse<SubmissionResponse> gradeSubmission(
            @PathVariable String id,
            @RequestBody @Valid GradingRequest request) {
        log.info("POST /api/submission/{}/grade - Grading submission", id);
        
        SubmissionResponse submission = submissionService.gradeSubmission(id, request);
        
        return ApiResponse.<SubmissionResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Submission graded successfully")
            .result(submission)
            .build();
    }

    /**
     * Get submission by ID
     */
    @GetMapping("/{id}")
    public ApiResponse<SubmissionResponse> getSubmission(@PathVariable String id) {
        log.info("GET /api/submission/{} - Getting submission", id);
        
        SubmissionResponse submission = submissionService.getSubmission(id);
        
        return ApiResponse.<SubmissionResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Submission retrieved successfully")
            .result(submission)
            .build();
    }

    /**
     * Get all submissions for a homework
     */
    @GetMapping("/homework/{homeworkId}")
    public ApiResponse<Page<SubmissionResponse>> getSubmissionsByHomework(
            @PathVariable String homeworkId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/submission/homework/{} - Getting submissions for homework", homeworkId);
        
        Page<SubmissionResponse> submissions = submissionService.getSubmissionsByHomework(homeworkId, page, size);
        
        return ApiResponse.<Page<SubmissionResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Homework submissions retrieved successfully")
            .result(submissions)
            .build();
    }

    /**
     * Get all submissions by a student
     */
    @GetMapping("/student/{studentId}")
    public ApiResponse<Page<SubmissionResponse>> getSubmissionsByStudent(
            @PathVariable String studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/submission/student/{} - Getting submissions for student", studentId);
        
        Page<SubmissionResponse> submissions = submissionService.getSubmissionsByStudent(studentId, page, size);
        
        return ApiResponse.<Page<SubmissionResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Student submissions retrieved successfully")
            .result(submissions)
            .build();
    }

    /**
     * Get pending submissions for grading
     */
    @GetMapping("/homework/{homeworkId}/pending")
    public ApiResponse<List<SubmissionResponse>> getPendingSubmissions(@PathVariable String homeworkId) {
        log.info("GET /api/submission/homework/{}/pending - Getting pending submissions", homeworkId);
        
        List<SubmissionResponse> submissions = submissionService.getPendingSubmissions(homeworkId);
        
        return ApiResponse.<List<SubmissionResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Pending submissions retrieved successfully")
            .result(submissions)
            .build();
    }

    /**
     * Get student's latest submission for a homework
     */
    @GetMapping("/homework/{homeworkId}/student/{studentId}/latest")
    public ApiResponse<SubmissionResponse> getLatestSubmission(
            @PathVariable String homeworkId,
            @PathVariable String studentId) {
        log.info("GET /api/submission/homework/{}/student/{}/latest - Getting latest submission", homeworkId, studentId);
        
        Optional<SubmissionResponse> submission = submissionService.getLatestSubmission(homeworkId, studentId);
        
        if (submission.isPresent()) {
            return ApiResponse.<SubmissionResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Latest submission retrieved successfully")
                .result(submission.get())
                .build();
        } else {
            return ApiResponse.<SubmissionResponse>builder()
                .code(HttpStatus.NOT_FOUND.value())
                .message("No submission found for this student and homework")
                .build();
        }
    }

    /**
     * Get submission statistics for a homework
     */
    @GetMapping("/homework/{homeworkId}/stats")
    public ApiResponse<SubmissionService.SubmissionStatsResponse> getSubmissionStats(@PathVariable String homeworkId) {
        log.info("GET /api/submission/homework/{}/stats - Getting submission statistics", homeworkId);
        
        SubmissionService.SubmissionStatsResponse stats = submissionService.getSubmissionStats(homeworkId);
        
        return ApiResponse.<SubmissionService.SubmissionStatsResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Submission statistics retrieved successfully")
            .result(stats)
            .build();
    }

    /**
     * Update submission status
     */
    @PutMapping("/{id}/status")
    public ApiResponse<SubmissionResponse> updateSubmissionStatus(
            @PathVariable String id,
            @RequestParam SubmissionStatus status) {
        log.info("PUT /api/submission/{}/status - Updating submission status to {}", id, status);
        
        SubmissionResponse submission = submissionService.updateSubmissionStatus(id, status);
        
        return ApiResponse.<SubmissionResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Submission status updated successfully")
            .result(submission)
            .build();
    }

    /**
     * Bulk grade submissions
     */
    @PostMapping("/bulk/grade")
    public ApiResponse<List<SubmissionResponse>> bulkGradeSubmissions(
            @RequestParam List<String> submissionIds,
            @RequestBody @Valid GradingRequest gradingTemplate) {
        log.info("POST /api/submission/bulk/grade - Bulk grading {} submissions", submissionIds.size());
        
        List<SubmissionResponse> submissions = submissionService.bulkGradeSubmissions(submissionIds, gradingTemplate);
        
        return ApiResponse.<List<SubmissionResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Submissions graded successfully")
            .result(submissions)
            .build();
    }

    /**
     * Delete submission
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSubmission(@PathVariable String id) {
        log.info("DELETE /api/submission/{} - Deleting submission", id);
        
        submissionService.deleteSubmission(id);
        
        return ApiResponse.<Void>builder()
            .code(HttpStatus.OK.value())
            .message("Submission deleted successfully")
            .build();
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.<String>builder()
            .code(HttpStatus.OK.value())
            .message("SubmissionService is running")
            .result("OK")
            .build();
    }
}