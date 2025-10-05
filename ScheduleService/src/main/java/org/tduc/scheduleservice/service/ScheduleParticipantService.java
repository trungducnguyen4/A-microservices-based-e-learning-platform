package org.tduc.scheduleservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.tduc.scheduleservice.dto.request.ScheduleParticipantCreationRequest;
import org.tduc.scheduleservice.exception.AppException;
import org.tduc.scheduleservice.exception.ErrorCode;
import org.tduc.scheduleservice.mapper.ScheduleMapper;
import org.tduc.scheduleservice.model.Schedule;
import org.tduc.scheduleservice.model.ScheduleParticipant;
import org.tduc.scheduleservice.repository.ScheduleParticipantRepository;
import org.tduc.scheduleservice.repository.ScheduleRepository;

import java.util.List;
import java.util.Optional; // <-- Add this import

@Service
public class ScheduleParticipantService {
    @Autowired
    private ScheduleParticipantRepository scheduleParticipantRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private ScheduleMapper scheduleMapper;

    public ScheduleParticipant createScheduleParticipant(ScheduleParticipantCreationRequest request) {
        // Find schedule by join code
        Optional<Schedule> optionalSchedule = scheduleRepository.findByJoinCode(request.getJoinCode());
        if (!optionalSchedule.isPresent()) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }
        Schedule schedule = optionalSchedule.get();

        // Check if user already joined
        boolean exists = scheduleParticipantRepository.existsByScheduleIdAndUserId(
                schedule.getId(), request.getUserId());
        if (exists) {
            throw new AppException(ErrorCode.USER_ALREADY_JOINED);
        }

        // Map and save participant
        ScheduleParticipant participant = scheduleMapper.toScheduleParticipant(request);
        return scheduleParticipantRepository.save(participant);
    }

    public List<ScheduleParticipant> getScheduleParticipants() {
        return scheduleParticipantRepository.findAll();
    }

    public List<ScheduleParticipant> getParticipantsByScheduleId(String scheduleId) {
        return scheduleParticipantRepository.findByScheduleId(scheduleId);
    }
}