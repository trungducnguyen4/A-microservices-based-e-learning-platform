package org.tduc.scheduleservice.dto.response;

import jakarta.persistence.Column;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.ZonedDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleParticipantCreationResponse {
    @Column(nullable = false)
    String teacherId;
    List<String> collaborators;
    @Column(nullable = false)
    String title;
    @Column(nullable = false)
    ZonedDateTime startTime;
    @Column(nullable = false)
    String joinCode;
    @Column(nullable = false)
    ZonedDateTime endTime;
    // Quy tắc lặp (RRULE, iCal format)
    @Column(columnDefinition = "TEXT")
    String recurrenceRule;
}
