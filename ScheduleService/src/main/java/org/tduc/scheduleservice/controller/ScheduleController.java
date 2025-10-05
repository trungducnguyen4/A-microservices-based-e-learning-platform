package org.tduc.scheduleservice.controller;

import jakarta.persistence.Entity;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.scheduleservice.dto.request.ApiResponse;
import org.tduc.scheduleservice.dto.request.ScheduleCreationRequest;
import org.tduc.scheduleservice.dto.request.ScheduleEditRequest;
import org.tduc.scheduleservice.model.Schedule;
import org.tduc.scheduleservice.service.ScheduleService;

import java.util.List;

@RestController
public class ScheduleController {
    @Autowired
    private ScheduleService scheduleService;

    @PostMapping("/create")
    public ApiResponse<Schedule> createSchedule(@RequestBody @Valid ScheduleCreationRequest request) {
        ApiResponse<Schedule> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleService.createSchedule(request));
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