package org.tduc.scheduleservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.scheduleservice.model.Schedule;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    boolean existsByJoinCode(String randomCode);

    List<Schedule> findByTeacherId(String teacherId);
}