package org.tduc.scheduleservice.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.tduc.scheduleservice.dto.request.ScheduleParticipantCreationRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.tduc.scheduleservice.model.ScheduleParticipant;
import org.tduc.scheduleservice.service.ScheduleParticipantService;
import org.tduc.scheduleservice.dto.response.ScheduleCreationResponse;
import org.tduc.scheduleservice.util.AuthContextUtil;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleParticipantController {
    @Autowired
    private ScheduleParticipantService scheduleParticipantService;

    @Autowired
    private AuthContextUtil authContextUtil;

    @PostMapping("/join")
    public ResponseEntity<?> createScheduleParticipant(@RequestBody @Valid ScheduleParticipantCreationRequest request) {
        org.tduc.scheduleservice.dto.request.ApiResponse<ScheduleParticipant> response = new org.tduc.scheduleservice.dto.request.ApiResponse<>();
        // Capture Authorization header so service can call UserService to resolve username->id if needed
        // If userId not provided by client, pick it from headers injected by API Gateway
        String authHeader = null;
        try {
            // servlet request isn't directly available by default; attempt to read via HttpServletRequest argument if provided
            // (we'll also try to read via AuthContextUtil raw header fallback)
            HttpServletRequest servletRequest = ((HttpServletRequest) ((org.springframework.web.context.request.ServletRequestAttributes)
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest());
            authHeader = servletRequest.getHeader("Authorization");
        } catch (Exception ignored) {
            // ignore and fallback
        }

        request.setAuthHeader(authHeader);

        if (request.getUserId() == null || request.getUserId().isBlank()) {
            // Prefer raw header (may be UUID) so downstream stores the actual user id instead of username
            String rawUserId = authContextUtil.getCurrentUserIdRaw();
            if (rawUserId != null && !rawUserId.isBlank()) {
                request.setUserId(rawUserId);
            } else {
                Long currentUserId = authContextUtil.getCurrentUserId();
                if (currentUserId != null) {
                    request.setUserId(String.valueOf(currentUserId));
                }
            }
        }

        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleParticipantService.createScheduleParticipant(request));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/scheduleParticipants")
    public ResponseEntity<?> getScheduleParticipants() {
        org.tduc.scheduleservice.dto.request.ApiResponse<List<ScheduleParticipant>> response = new org.tduc.scheduleservice.dto.request.ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleParticipantService.getScheduleParticipants());
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get schedules the current user is enrolled in.
     * GET /my-schedule
     */
    @GetMapping("/my-schedule")
    public ResponseEntity<?> getMyEnrollments() {
        org.tduc.scheduleservice.dto.request.ApiResponse<List<ScheduleCreationResponse>> response = new org.tduc.scheduleservice.dto.request.ApiResponse<>();
        // Try to read raw header first (may be UUID). If raw is numeric, use numeric path; otherwise use string path.
        String rawUserId = authContextUtil.getCurrentUserIdRaw();
        response.setCode(HttpStatus.OK.value());
        if (rawUserId != null && !rawUserId.isBlank()) {
            // check if numeric
            try {
                Long numeric = Long.parseLong(rawUserId);
                response.setResult(scheduleParticipantService.getEnrollmentsForUser(numeric));
            } catch (NumberFormatException ex) {
                // not numeric -> treat as string id (UUID)
                response.setResult(scheduleParticipantService.getEnrollmentsForUserByString(rawUserId));
            }
        } else {
            Long currentUserId = authContextUtil.getCurrentUserId();
            response.setResult(scheduleParticipantService.getEnrollmentsForUser(currentUserId));
        }
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // New endpoint: list participants for a specific schedule id
    @GetMapping("/{scheduleId}/participants")
    public ResponseEntity<?> getParticipantsBySchedule(@PathVariable String scheduleId) {
        org.tduc.scheduleservice.dto.request.ApiResponse<List<ScheduleParticipant>> response = new org.tduc.scheduleservice.dto.request.ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleParticipantService.getParticipantsByScheduleId(scheduleId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

}
