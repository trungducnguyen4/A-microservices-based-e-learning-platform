package org.tduc.adminservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.tduc.adminservice.dto.request.ApiResponse;
import org.tduc.adminservice.service.AdminAnalyticsService;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    public AdminAnalyticsController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/summary")
    public ApiResponse<?> summary() {
        return ApiResponse.builder()
                .code(HttpStatus.OK.value())
                .message("OK")
                .result(adminAnalyticsService.getSummary())
                .build();
    }
}
