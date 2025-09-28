package org.tduc.scheduleservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.scheduleservice.model.Schedule;

public interface ScheduleRepository extends JpaRepository<Schedule, String> {
}