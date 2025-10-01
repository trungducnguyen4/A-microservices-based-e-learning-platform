package org.tduc.scheduleservice.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.tduc.scheduleservice.dto.request.ApiResponse;
import org.tduc.scheduleservice.dto.request.ScheduleParticipantCreationRequest;
import org.tduc.scheduleservice.model.ScheduleParticipant;
import org.tduc.scheduleservice.service.ScheduleParticipantService;

import java.util.List;

@RestController
public class ScheduleParticipantController {
    @Autowired
    private ScheduleParticipantService scheduleParticipantService;

    @PostMapping("/scheduleParticipants")
    public ApiResponse<ScheduleParticipant> createScheduleParticipant(@RequestBody @Valid ScheduleParticipantCreationRequest request) {
        ApiResponse<ScheduleParticipant> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleParticipantService.createScheduleParticipant(request));
        return response;
    }

    @GetMapping("/scheduleParticipants")
    public ApiResponse<List<ScheduleParticipant>> getScheduleParticipants() {
        ApiResponse<List<ScheduleParticipant>> response = new ApiResponse<>();
        response.setCode(HttpStatus.OK.value());
        response.setResult(scheduleParticipantService.getScheduleParticipants());
        return response;
    }
}