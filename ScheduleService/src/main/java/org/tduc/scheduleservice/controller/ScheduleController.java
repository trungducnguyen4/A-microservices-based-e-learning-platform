package org.tduc.scheduleservice.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.scheduleservice.dto.request.ApiResponse;
import org.tduc.scheduleservice.dto.request.ScheduleCreationRequest;
import org.tduc.scheduleservice.dto.request.ScheduleEditRequest;
import org.tduc.scheduleservice.dto.response.ScheduleCreationResponse;
import org.tduc.scheduleservice.mapper.ScheduleMapper;
import org.tduc.scheduleservice.util.AuthContextUtil;
import org.tduc.scheduleservice.model.Schedule;
import org.tduc.scheduleservice.service.ScheduleService;

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
        response.setResult(schedules.stream().map(scheduleMapper::toScheduleCreationResponse).collect(Collectors.toList()));
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


}