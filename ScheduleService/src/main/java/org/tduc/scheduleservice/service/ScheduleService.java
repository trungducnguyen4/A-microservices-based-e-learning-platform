package org.tduc.scheduleservice.service;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.tduc.scheduleservice.dto.request.ScheduleCreationRequest;
import org.tduc.scheduleservice.dto.request.ScheduleEditRequest;
import org.tduc.scheduleservice.exception.AppException;
import org.tduc.scheduleservice.exception.ErrorCode;
import org.tduc.scheduleservice.mapper.ScheduleMapper;
import org.tduc.scheduleservice.model.Schedule;
import org.tduc.scheduleservice.repository.ScheduleRepository;

import java.security.SecureRandom;
import java.util.List;

@Service
public class ScheduleService {
    @Autowired
    ScheduleRepository scheduleRepository;
    @Autowired
    ScheduleMapper scheduleMapper;
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom random = new SecureRandom();

    public static String generateJoinCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = random.nextInt(CHARACTERS.length());
            sb.append(CHARACTERS.charAt(index));
        }
        return sb.toString();
    }
    public Schedule createSchedule(@Valid ScheduleCreationRequest request) {
        Schedule schedule = scheduleMapper.toSchedule(request);
        String randomCode;
        do {
            randomCode = generateJoinCode();
        } while (scheduleRepository.existsByJoinCode(randomCode));
        schedule.setJoinCode(randomCode);
        return scheduleRepository.save(schedule);
    }


    public List<Schedule> getSchedules() {
        return scheduleRepository.findAll();
    }

    public Schedule editSchedule(String id, @Valid ScheduleEditRequest request) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        scheduleMapper.updateSchedule(schedule, request);
        Schedule savedSchedule = scheduleRepository.save(schedule);
        return savedSchedule;
    }
    public List<Schedule> getSchedulesById(String teacherId) {
        return scheduleRepository.findByTeacherId(teacherId);
    }
    public Schedule getScheduleById(String scheduleId) {
        return scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
    }
}