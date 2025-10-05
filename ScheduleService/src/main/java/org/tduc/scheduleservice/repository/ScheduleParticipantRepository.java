package org.tduc.scheduleservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.scheduleservice.model.ScheduleParticipant;

import java.util.List;

public interface ScheduleParticipantRepository extends JpaRepository<ScheduleParticipant, String> {
    boolean existsByScheduleIdAndUserId(String id, String userId);

    List<ScheduleParticipant> findByScheduleId(String scheduleId);

}