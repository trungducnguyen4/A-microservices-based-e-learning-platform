package org.tduc.adminservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.tduc.adminservice.dto.request.ApiResponse;
import org.tduc.adminservice.service.AdminAuditService;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/system")
public class AdminSystemController {

    private final AdminAuditService adminAuditService;

    public AdminSystemController(AdminAuditService adminAuditService) {
        this.adminAuditService = adminAuditService;
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", "UP");
        payload.put("timestamp", Instant.now().toString());
        payload.put("auditLogsEnabled", adminAuditService.isEnabled());
        return ApiResponse.<Map<String, Object>>builder()
                .code(HttpStatus.OK.value())
                .message("OK")
                .result(payload)
                .build();
    }
}
