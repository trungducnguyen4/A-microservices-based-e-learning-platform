package org.tduc.scheduleservice1.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.scheduleservice1.dto.request.ApiResponse;
import org.tduc.scheduleservice1.dto.request.JoinClassroomRequest;
import org.tduc.scheduleservice1.dto.request.ScheduleCreationRequest;
import org.tduc.scheduleservice1.dto.request.ScheduleEditRequest;
import org.tduc.scheduleservice1.dto.response.JoinClassroomResponse;
import org.tduc.scheduleservice1.dto.response.ScheduleCreationResponse;
import org.tduc.scheduleservice1.mapper.ScheduleMapper;
import org.tduc.scheduleservice1.util.AuthContextUtil;
import org.tduc.scheduleservice1.model.Schedule;
import org.tduc.scheduleservice1.service.ScheduleService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {
    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private AuthContextUtil authContextUtil;

    @Autowired
    private ScheduleMapper scheduleMapper;
    @Autowired
    private org.tduc.scheduleservice1.service.ScheduleParticipantService scheduleParticipantService;

    @PostMapping("/create")
    public ApiResponse<Schedule> createSchedule(@RequestBody @Valid ScheduleCreationRequest request) {
        ApiResponse<Schedule> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.createSchedule(request));
        return response;
    }

    /**
     * Get schedules owned by the current user (teacher). Returns ScheduleCreationResponse list.
     */
    @GetMapping("/my-owned")
    public ApiResponse<List<ScheduleCreationResponse>> getMyOwnedSchedules() {
        ApiResponse<List<ScheduleCreationResponse>> response = new ApiResponse<>();

        // Prefer raw header (may be UUID); otherwise use numeric id if available
        String rawUserId = authContextUtil.getCurrentUserIdRaw();
        List<Schedule> schedules;
        if (rawUserId != null && !rawUserId.isBlank()) {
            schedules = scheduleService.getSchedulesById(rawUserId);
        } else {
            Long numeric = authContextUtil.getCurrentUserId();
            schedules = scheduleService.getSchedulesById(String.valueOf(numeric));
        }

        response.setCode(HttpStatus.OK.value());
        // Map schedules and enrich with enrolled student counts
        List<ScheduleCreationResponse> result = schedules.stream().map(scheduleMapper::toScheduleCreationResponse).collect(Collectors.toList());
        for (int i = 0; i < schedules.size(); i++) {
            Schedule s = schedules.get(i);
            ScheduleCreationResponse r = result.get(i);
            try {
                int count = scheduleParticipantService.getParticipantsByScheduleId(s.getId()).size();
                r.setEnrolledStudents(count);
            } catch (Exception ex) {
                // If participant lookup fails, leave enrolledStudents null to avoid hiding schedules
            }
        }
        response.setResult(result);
        return response;
    }

    @GetMapping("/schedules")
    public ApiResponse<List<Schedule>> getSchedules() {
        ApiResponse<List<Schedule>> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.getSchedules());
        return response;
    }
    @GetMapping("/{scheduleId}")
    public ApiResponse<Schedule> getSchedule(@PathVariable String scheduleId) {
        ApiResponse<Schedule> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.getScheduleById(scheduleId));
        return response;
    }

    @PutMapping("/{scheduleId}")
    public ApiResponse<Schedule> updateSchedule(@PathVariable String scheduleId, @RequestBody @Valid ScheduleEditRequest request) {
        ApiResponse<Schedule> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.editSchedule(scheduleId, request));
        return response;
    }

    /**
     * Regenerate join code for a schedule (teacher only)
     */
    @PostMapping("/{scheduleId}/regenerate-code")
    public ApiResponse<Schedule> regenerateJoinCode(@PathVariable String scheduleId) {
        ApiResponse<Schedule> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.regenerateJoinCode(scheduleId));
        return response;
    }

    /**
     * Join classroom with join code
     * Teacher can always join, students must wait for teacher
     */
    @PostMapping("/join-classroom")
    public ApiResponse<JoinClassroomResponse> joinClassroom(@RequestBody @Valid JoinClassroomRequest request) {
        ApiResponse<JoinClassroomResponse> response = new ApiResponse<>();
        
        // Get current user ID
        String rawUserId = authContextUtil.getCurrentUserIdRaw();
        if (rawUserId == null || rawUserId.isBlank()) {
            Long numeric = authContextUtil.getCurrentUserId();
            rawUserId = String.valueOf(numeric);
        }
        
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.joinClassroom(request.getJoinCode(), rawUserId));
        return response;
    }

}
