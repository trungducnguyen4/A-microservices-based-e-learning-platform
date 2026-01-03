package org.tduc.announcementservice1.util;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthContextUtil {

    private final HttpServletRequest request;

    public String getCurrentUserIdRaw() {
        String v = request.getHeader("X-User-Id");
        if (v == null) v = request.getHeader("x-user-id");
        return v;
    }

    public boolean isTeacher() {
        String role = request.getHeader("X-User-Role");
        if (role == null) role = request.getHeader("x-user-role");
        return "TEACHER".equalsIgnoreCase(role);
    }
}
