
package org.tduc.userservice.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.userservice.dto.request.*;
import org.tduc.userservice.dto.response.AuthResponse;
import org.tduc.userservice.dto.response.IntrospectResponse;
import org.tduc.userservice.dto.response.UserResponse;
import org.tduc.userservice.model.User;
import org.tduc.userservice.service.UserService;

import java.util.List;
import java.util.Map; // <-- Add this import

@RestController
public class UserController {
    @Autowired
    private UserService userService ;

    @PostMapping("/users")
    public ApiResponse<User> createUser(@RequestBody @Valid UserCreationRequest request, HttpServletResponse httpServletResponse) {
        ApiResponse<User> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(userService.createRequest(request));
        return response;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userService.getUsers();
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<UserResponse> getUser (@PathVariable("userId") Long userId) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(userService.getUser(userId));
        return response;
    }

    @PutMapping("/users/{userId}")
    public ApiResponse<UserResponse> editUser(@PathVariable Long userId, @RequestBody UserEditRequest request) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(userService.editUser(userId, request));
        return response;
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PostMapping("/auth/login")
    public ApiResponse<AuthResponse> authenticate(@RequestBody AuthRequest authRequest) {
        AuthResponse result = userService.authenticate(authRequest);
        ApiResponse<AuthResponse> response = new ApiResponse<>();
        response.setResult(result);
        return response;
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest introspectRequest) {
        var result = userService.introspect(introspectRequest);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PutMapping("/users/role")
    public ApiResponse<UserResponse> updateRole(@RequestBody Map<String, String> body, @RequestHeader("Authorization") String authHeader) {
        String role = body.get("role");
        String token = authHeader.replace("Bearer ", "");
        UserResponse updatedUser = userService.updateRole(token, role);
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(updatedUser);
        return response;
    }
}