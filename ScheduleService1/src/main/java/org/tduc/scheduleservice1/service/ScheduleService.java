package org.tduc.scheduleservice1.service;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.tduc.scheduleservice1.dto.request.ScheduleCreationRequest;
import org.tduc.scheduleservice1.dto.request.ScheduleEditRequest;
import org.tduc.scheduleservice1.dto.response.JoinClassroomResponse;
import org.tduc.scheduleservice1.exception.AppException;
import org.tduc.scheduleservice1.exception.ErrorCode;
import org.tduc.scheduleservice1.mapper.ScheduleMapper;
import org.tduc.scheduleservice1.model.Schedule;
import org.tduc.scheduleservice1.repository.ScheduleRepository;
import org.tduc.scheduleservice1.repository.ScheduleParticipantRepository;

import java.security.SecureRandom;
import java.util.List;

@Service
public class ScheduleService {
    @Autowired
    ScheduleRepository scheduleRepository;
    @Autowired
    ScheduleMapper scheduleMapper;
    @Autowired
    ScheduleParticipantRepository participantRepository;
    
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
        
        // Generate unique join code (also used as room code for LiveKit)
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
        return scheduleRepository.findByUserId(teacherId);
    }
    public Schedule getScheduleById(String scheduleId) {
        return scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
    }

    /**
     * Regenerate a new unique join code for a schedule
     */
    public Schedule regenerateJoinCode(String scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        // Generate new unique join code
        String newCode;
        do {
            newCode = generateJoinCode();
        } while (scheduleRepository.existsByJoinCode(newCode));
        
        schedule.setJoinCode(newCode);
        return scheduleRepository.save(schedule);
    }
    
    /**
     * Join classroom with join code
     * Teacher can always join, students must wait for teacher
     */
    public JoinClassroomResponse joinClassroom(String joinCode, String userId) {
        // Find schedule by join code
        Schedule schedule = scheduleRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        // Check if user is the teacher (owner)
        boolean isTeacher = schedule.getUserId().equals(userId);
        
        // Check if teacher has joined (by checking participants)
        boolean teacherJoined = participantRepository.existsByScheduleIdAndUserId(
            schedule.getId(), 
            schedule.getUserId()
        );
        
        JoinClassroomResponse response = JoinClassroomResponse.builder()
                .scheduleId(schedule.getId())
                .title(schedule.getTitle())
                .joinCode(schedule.getJoinCode()) // joinCode = roomCode
                .isTeacher(isTeacher)
                .teacherJoined(teacherJoined)
                .build();
        
        // Logic: Teacher can always join, students must wait
        if (isTeacher) {
            response.setCanJoin(true);
            response.setMessage("Bạn là giáo viên, có thể vào phòng học bất cứ lúc nào");
        } else {
            if (teacherJoined) {
                response.setCanJoin(true);
                response.setMessage("Giáo viên đã vào phòng, bạn có thể tham gia");
            } else {
                response.setCanJoin(false);
                response.setMessage("Phòng học chưa bắt đầu. Vui lòng chờ giáo viên vào phòng");
            }
        }
        
        return response;
    }
}
