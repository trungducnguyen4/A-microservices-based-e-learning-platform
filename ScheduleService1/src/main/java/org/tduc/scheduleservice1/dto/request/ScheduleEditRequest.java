package org.tduc.scheduleservice1.dto.request;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.scheduleservice1.model.ScheduleStatus;

import java.time.ZonedDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleEditRequest {
    @Column(nullable = false)
    String userId;
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
