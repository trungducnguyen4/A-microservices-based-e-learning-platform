package org.tduc.scheduleservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.scheduleservice.model.ScheduleParticipant;

public interface ScheduleParticipantRepository extends JpaRepository<ScheduleParticipant, String> {
}