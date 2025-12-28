package org.tduc.adminservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.tduc.adminservice.dto.request.ApiResponse;
import org.tduc.adminservice.dto.response.AdminSummaryResponse;
import org.tduc.adminservice.service.AdminDashboardService;
import org.tduc.adminservice.util.AuthContextUtil;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthContextUtil authContextUtil;
    private final AdminDashboardService adminDashboardService;

    public AdminController(AuthContextUtil authContextUtil, AdminDashboardService adminDashboardService) {
        this.authContextUtil = authContextUtil;
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", "UP");
        payload.put("timestamp", Instant.now().toString());
        return ApiResponse.<Map<String, Object>>builder()
                .code(HttpStatus.OK.value())
                .message("AdminService is running")
                .result(payload)
                .build();
    }

    @GetMapping("/ping")
    public ApiResponse<String> ping() {
        return ApiResponse.<String>builder()
                .code(HttpStatus.OK.value())
                .message("pong")
                .result("pong")
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Map<String, Object>> currentAdmin() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", authContextUtil.getCurrentUserId());
        payload.put("username", authContextUtil.getCurrentUsername());
        payload.put("role", authContextUtil.getCurrentUserRole());
        payload.put("isAdmin", authContextUtil.isAdmin());
        return ApiResponse.<Map<String, Object>>builder()
                .code(HttpStatus.OK.value())
                .message("Current admin info")
                .result(payload)
                .build();
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<AdminSummaryResponse> summary() {
        AdminSummaryResponse summary = adminDashboardService.getSummary();
        return ApiResponse.<AdminSummaryResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Dashboard summary")
                .result(summary)
                .build();
    }
}
