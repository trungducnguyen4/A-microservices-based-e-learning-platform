package org.tduc.homeworkservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.homeworkservice.dto.request.ApiResponse;
import org.tduc.homeworkservice.dto.request.HomeworkCreationRequest;
import org.tduc.homeworkservice.dto.request.HomeworkUpdateRequest;
import org.tduc.homeworkservice.dto.response.HomeworkResponse;
import org.tduc.homeworkservice.model.HomeworkStatus;
import org.tduc.homeworkservice.service.HomeworkService;
import org.tduc.homeworkservice.util.AuthContextUtil;

import java.util.List;

@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
@Slf4j
public class HomeworkController {
    
    private final HomeworkService homeworkService;
    private final AuthContextUtil authContextUtil;

    /**
     * Create a new homework assignment
     */
    @PostMapping
    public ApiResponse<HomeworkResponse> createHomework(@RequestBody @Valid HomeworkCreationRequest request) {
        // Get user context from API Gateway headers
        Long currentUserId = authContextUtil.getCurrentUserId();
        String currentUserRole = authContextUtil.getCurrentUserRole();
        
        log.info("POST /api/homework - Creating homework: {} by {}", 
            request.getTitle(), authContextUtil.getCurrentUserContext());
        
        // Only teachers can create homework
        if (!authContextUtil.isTeacher()) {
            return ApiResponse.<HomeworkResponse>builder()
                .code(HttpStatus.FORBIDDEN.value())
                .message("Only teachers can create homework assignments")
                .build();
        }
        
        HomeworkResponse homework = homeworkService.createHomework(request);
        
        return ApiResponse.<HomeworkResponse>builder()
            .code(HttpStatus.CREATED.value())
            .message("Homework created successfully")
            .result(homework)
            .build();
    }

    /**
     * Update an existing homework
     */
    @PutMapping("/{id}")
    public ApiResponse<HomeworkResponse> updateHomework(
            @PathVariable String id,
            @RequestBody @Valid HomeworkUpdateRequest request) {
        log.info("PUT /api/homework/{} - Updating homework", id);
        
        HomeworkResponse homework = homeworkService.updateHomework(id, request);
        
        return ApiResponse.<HomeworkResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Homework updated successfully")
            .result(homework)
            .build();
    }

    /**
     * Get homework by ID
     */
    @GetMapping("/{id}")
    public ApiResponse<HomeworkResponse> getHomework(@PathVariable String id) {
        log.info("GET /api/homework/{} - Getting homework", id);
        
        HomeworkResponse homework = homeworkService.getHomework(id);
        
        return ApiResponse.<HomeworkResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Homework retrieved successfully")
            .result(homework)
            .build();
    }

    /**
     * Get all homeworks for a course
     */
    @GetMapping("/course/{courseId}")
    public ApiResponse<Page<HomeworkResponse>> getHomeworksByCourse(
            @PathVariable String courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/homework/course/{} - Getting homeworks for course", courseId);
        
        Page<HomeworkResponse> homeworks = homeworkService.getHomeworksByCourse(courseId, page, size);
        
        return ApiResponse.<Page<HomeworkResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Homeworks retrieved successfully")
            .result(homeworks)
            .build();
    }

    /**
     * Get homeworks created by teacher
     */
    @GetMapping("/teacher/{teacherId}")
    public ApiResponse<Page<HomeworkResponse>> getHomeworksByTeacher(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/homework/teacher/{} - Getting homeworks by teacher", teacherId);
        
        Page<HomeworkResponse> homeworks = homeworkService.getHomeworksByCreator(teacherId, page, size);
        
        return ApiResponse.<Page<HomeworkResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Teacher homeworks retrieved successfully")
            .result(homeworks)
            .build();
    }

    /**
     * Search homeworks by keyword
     */
    @GetMapping("/search")
    public ApiResponse<Page<HomeworkResponse>> searchHomeworks(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/homework/search - Searching homeworks with keyword: {}", keyword);
        
        Page<HomeworkResponse> homeworks = homeworkService.searchHomeworks(keyword, page, size);
        
        return ApiResponse.<Page<HomeworkResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Search completed successfully")
            .result(homeworks)
            .build();
    }

    /**
     * Get active homeworks for a student
     */
    @GetMapping("/student/{studentId}/active")
    public ApiResponse<List<HomeworkResponse>> getActiveHomeworksForStudent(@PathVariable String studentId) {
        log.info("GET /api/homework/student/{}/active - Getting active homeworks for student", studentId);
        
        List<HomeworkResponse> homeworks = homeworkService.getActiveHomeworksForStudent(studentId);
        
        return ApiResponse.<List<HomeworkResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Active homeworks retrieved successfully")
            .result(homeworks)
            .build();
    }

    /**
     * Get overdue homeworks for a course
     */
    @GetMapping("/course/{courseId}/overdue")
    public ApiResponse<List<HomeworkResponse>> getOverdueHomeworks(@PathVariable String courseId) {
        log.info("GET /api/homework/course/{}/overdue - Getting overdue homeworks", courseId);
        
        List<HomeworkResponse> homeworks = homeworkService.getOverdueHomeworks(courseId);
        
        return ApiResponse.<List<HomeworkResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Overdue homeworks retrieved successfully")
            .result(homeworks)
            .build();
    }

    /**
     * Publish homework (make it available to students)
     */
    @PostMapping("/{id}/publish")
    public ApiResponse<HomeworkResponse> publishHomework(@PathVariable String id) {
        log.info("POST /api/homework/{}/publish - Publishing homework", id);
        
        HomeworkResponse homework = homeworkService.publishHomework(id);
        
        return ApiResponse.<HomeworkResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Homework published successfully")
            .result(homework)
            .build();
    }

    /**
     * Get homework statistics for a course
     */
    @GetMapping("/course/{courseId}/stats")
    public ApiResponse<HomeworkService.HomeworkStatsResponse> getHomeworkStats(@PathVariable String courseId) {
        log.info("GET /api/homework/course/{}/stats - Getting homework statistics", courseId);
        
        HomeworkService.HomeworkStatsResponse stats = homeworkService.getHomeworkStats(courseId);
        
        return ApiResponse.<HomeworkService.HomeworkStatsResponse>builder()
            .code(HttpStatus.OK.value())
            .message("Homework statistics retrieved successfully")
            .result(stats)
            .build();
    }

    /**
     * Bulk update homework status
     */
    @PutMapping("/bulk/status")
    public ApiResponse<Void> bulkUpdateStatus(
            @RequestParam List<String> homeworkIds,
            @RequestParam HomeworkStatus status) {
        log.info("PUT /api/homework/bulk/status - Bulk updating {} homeworks to status {}", homeworkIds.size(), status);
        
        homeworkService.bulkUpdateStatus(homeworkIds, status);
        
        return ApiResponse.<Void>builder()
            .code(HttpStatus.OK.value())
            .message("Homework status updated successfully")
            .build();
    }

    /**
     * Delete homework
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteHomework(@PathVariable String id) {
        log.info("DELETE /api/homework/{} - Deleting homework", id);
        
        homeworkService.deleteHomework(id);
        
        return ApiResponse.<Void>builder()
            .code(HttpStatus.OK.value())
            .message("Homework deleted successfully")
            .build();
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.<String>builder()
            .code(HttpStatus.OK.value())
            .message("HomeworkService is running")
            .result("OK")
            .build();
    }
    
    /**
     * Get all homeworks
     */
    @GetMapping
    public ApiResponse<List<HomeworkResponse>> getAllHomeworks() {
        log.info("GET /api/homework - Getting all homeworks");
        
        List<HomeworkResponse> homeworks = homeworkService.getAllHomeworks();
        
        return ApiResponse.<List<HomeworkResponse>>builder()
            .code(HttpStatus.OK.value())
            .message("Homeworks retrieved successfully")
            .result(homeworks)
            .build();
    }
}