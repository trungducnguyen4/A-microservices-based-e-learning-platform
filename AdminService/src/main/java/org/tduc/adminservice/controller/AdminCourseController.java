package org.tduc.adminservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.tduc.adminservice.dto.request.ApiResponse;
import org.tduc.adminservice.service.AdminCourseService;

@RestController
@RequestMapping("/api/admin/courses")
public class AdminCourseController {

    private final AdminCourseService adminCourseService;

    public AdminCourseController(AdminCourseService adminCourseService) {
        this.adminCourseService = adminCourseService;
    }

    @GetMapping
    public ApiResponse<?> listCourses() {
        return ApiResponse.builder()
                .code(HttpStatus.OK.value())
                .message("OK")
                .result(adminCourseService.listCourses())
                .build();
    }
}
