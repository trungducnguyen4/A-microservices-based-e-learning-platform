package org.tduc.adminservice.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuthContextUtil {

    private final HttpServletRequest request;

    public AuthContextUtil(HttpServletRequest request) {
        this.request = request;
    }

    public String getCurrentUserId() {
        String fromHeader = request.getHeader("X-User-Id");
        if (fromHeader != null && !fromHeader.isBlank()) {
            return fromHeader;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    public String getCurrentUsername() {
        String fromHeader = request.getHeader("X-User-Username");
        if (fromHeader != null && !fromHeader.isBlank()) {
            return fromHeader;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    public String getCurrentUserRole() {
        String fromHeader = request.getHeader("X-User-Role");
        if (fromHeader != null && !fromHeader.isBlank()) {
            return fromHeader;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Optional<? extends GrantedAuthority> first = authentication.getAuthorities().stream().findFirst();
        return first.map(GrantedAuthority::getAuthority).orElse(null);
    }

    public boolean isAdmin() {
        String role = getCurrentUserRole();
        return role != null && role.equalsIgnoreCase("ADMIN");
    }
}
