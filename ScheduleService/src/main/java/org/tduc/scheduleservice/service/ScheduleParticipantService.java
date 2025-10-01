
package org.tduc.scheduleservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.tduc.scheduleservice.dto.request.ScheduleParticipantCreationRequest;
import org.tduc.scheduleservice.mapper.ScheduleMapper;
import org.tduc.scheduleservice.model.ScheduleParticipant;
import org.tduc.scheduleservice.repository.ScheduleParticipantRepository;

import java.util.List;

@Service
public class ScheduleParticipantService {
    @Autowired
    ScheduleParticipantRepository scheduleParticipantRepository;

    @Autowired
    ScheduleMapper scheduleMapper;

    public ScheduleParticipant createScheduleParticipant(ScheduleParticipantCreationRequest request) {
        ScheduleParticipant participant = scheduleMapper.toScheduleParticipant(request);
        return scheduleParticipantRepository.save(participant);
    }

    public List<ScheduleParticipant> getScheduleParticipants() {
        return scheduleParticipantRepository.findAll();
    }

}