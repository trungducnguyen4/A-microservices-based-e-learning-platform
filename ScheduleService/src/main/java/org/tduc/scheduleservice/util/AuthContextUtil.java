package org.tduc.scheduleservice.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility class to extract user context from API Gateway headers
 */
@Component
public class AuthContextUtil {
    
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_ROLE_HEADER = "X-User-Role";
    private static final String USERNAME_HEADER = "X-User-Username";
    
    /**
     * Get current user ID from request headers
     */
    public Long getCurrentUserId() {
        String userIdStr = getHeader(USER_ID_HEADER);
        return userIdStr != null ? Long.parseLong(userIdStr) : null;
    }
    
    /**
     * Get current user role from request headers
     */
    public String getCurrentUserRole() {
        return getHeader(USER_ROLE_HEADER);
    }
    
    /**
     * Get current username from request headers
     */
    public String getCurrentUsername() {
        return getHeader(USERNAME_HEADER);
    }
    
    /**
     * Check if current user has specific role
     */
    public boolean hasRole(String role) {
        String userRole = getCurrentUserRole();
        return userRole != null && userRole.equalsIgnoreCase(role);
    }
    
    /**
     * Check if current user is a teacher
     */
    public boolean isTeacher() {
        return hasRole("TEACHER");
    }
    
    /**
     * Check if current user is a student
     */
    public boolean isStudent() {
        return hasRole("STUDENT");
    }
    
    /**
     * Check if current user is an admin
     */
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }
    
    /**
     * Get header value from current request
     */
    private String getHeader(String headerName) {
        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (requestAttributes != null) {
            HttpServletRequest request = requestAttributes.getRequest();
            return request.getHeader(headerName);
        }
        return null;
    }
    
    /**
     * Get current user context as a formatted string for logging
     */
    public String getCurrentUserContext() {
        return String.format("User[id=%s, username=%s, role=%s]", 
            getCurrentUserId(), getCurrentUsername(), getCurrentUserRole());
    }
}