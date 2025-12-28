package org.tduc.adminservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.tduc.adminservice.dto.request.ApiResponse;
import org.tduc.adminservice.service.AdminUserService;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ApiResponse<?> listUsers() {
        return ApiResponse.builder()
                .code(HttpStatus.OK.value())
                .message("OK")
                .result(adminUserService.listUsers())
                .build();
    }
}
