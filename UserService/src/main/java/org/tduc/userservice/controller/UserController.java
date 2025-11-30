package org.tduc.userservice.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.annotation.security.PermitAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.tduc.userservice.dto.request.*;
import org.tduc.userservice.dto.response.AuthResponse;
import org.tduc.userservice.dto.response.IntrospectResponse;
import org.tduc.userservice.dto.response.UserResponse;
import org.tduc.userservice.model.User;
import org.tduc.userservice.service.UserService;

import java.util.List;
import java.util.Map; // <-- Add this import
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.tduc.userservice.mapper.UserMapper;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')") // chỉ admin mới được tạo user
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request, HttpServletResponse httpServletResponse) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        User created = userService.createRequest(request);
        response.setResult(userMapper.toUserResponse(created));
        return response;
    }

    @GetMapping("/profile/{username}")
    @PreAuthorize("#username == authentication.name or hasAuthority('ADMIN')")
    public ApiResponse<UserResponse> getUser(@PathVariable String username, HttpServletResponse httpServletResponse) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        User user = userService.findByUsername(username);
        response.setResult(userMapper.toUserResponse(user));
        return response;
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')") // chỉ admin mới xem danh sách user
    public List<User> getUsers() {
        return userService.getUsers();
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(userService.getUser(userId));
        return response;
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ApiResponse<UserResponse> editUser(@PathVariable String userId, @RequestBody UserEditRequest request) {
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(userService.editUser(userId, request));
        return response;
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('ADMIN')") // chỉ admin xóa
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
    }

    @PostMapping("/auth/login")
    public ApiResponse<AuthResponse> authenticate(@RequestBody AuthRequest authRequest) {
        AuthResponse result = userService.authenticate(authRequest);
        ApiResponse<AuthResponse> response = new ApiResponse<>();
        response.setResult(result);
        return response;
    }

    // Public registration endpoint (used by client: POST /api/users/register forwarded by ApiGateway)
    // Accept both /auth/register and /register so requests forwarded by the gateway or sent directly will match.
    @PostMapping({"/auth/register", "/register"})
    @PermitAll
    public ApiResponse<UserResponse> register(@RequestBody @Valid UserCreationRequest request) {
        // Log authentication and headers for debugging why a 403 might be returned
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("Register invoked. Authentication: {}", auth == null ? "<none>" : auth.getName());
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        User created = userService.createRequest(request);
        response.setResult(userMapper.toUserResponse(created));
        return response;
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest introspectRequest) {
        var result = userService.introspect(introspectRequest);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PutMapping("/users/role")
    @PreAuthorize("hasAuthority('ADMIN')") // chỉ admin mới thay đổi role
    public ApiResponse<UserResponse> updateRole(@RequestBody Map<String, String> body, @RequestHeader("Authorization") String authHeader) {
        String role = body.get("role");
        String token = authHeader.replace("Bearer ", "");
        UserResponse updatedUser = userService.updateRole(token, role);
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(updatedUser);
        return response;
    }

    @PutMapping("/profile/{username}")
    @PreAuthorize("#username == authentication.name or hasAuthority('ADMIN')")
    public ApiResponse<UserResponse> updateProfile(@PathVariable String username,
                                                   @RequestBody UserEditRequest request,
                                                   @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        UserResponse updatedUser = userService.updateProfile(token, request);
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(updatedUser);
        return response;
    }

    /**
     * Allow authenticated users to choose their role only if they don't already have one.
     */
    @PostMapping("/choose-role")
    @PermitAll
    public ApiResponse<UserResponse> chooseRole(@RequestBody Map<String, String> body,
                                                @RequestHeader("Authorization") String authHeader) {
        String role = body.get("role");
        String token = authHeader.replace("Bearer ", "");
        UserResponse updated = userService.chooseRole(token, role);
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(updated);
        return response;
    }
}
