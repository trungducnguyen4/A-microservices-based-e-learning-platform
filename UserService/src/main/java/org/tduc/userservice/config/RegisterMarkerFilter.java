package org.tduc.userservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(0)
public class RegisterMarkerFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RegisterMarkerFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return !"/api/users/register".equalsIgnoreCase(path) && !"/api/users/auth/register".equalsIgnoreCase(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // Mark response early so even if something later modifies the status, header remains
        response.setHeader("X-Origin", "UserService");
        log.debug("RegisterMarkerFilter set X-Origin=UserService for path: {}", request.getRequestURI());
        filterChain.doFilter(request, response);
    }
}

