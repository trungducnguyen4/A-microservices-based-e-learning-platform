package org.tduc.scheduleservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.scheduleservice.model.Schedule;

import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    boolean existsByJoinCode(String randomCode);

    List<Schedule> findByTeacherId(String teacherId);
    Optional<Schedule> findByJoinCode(String joinCode);
}