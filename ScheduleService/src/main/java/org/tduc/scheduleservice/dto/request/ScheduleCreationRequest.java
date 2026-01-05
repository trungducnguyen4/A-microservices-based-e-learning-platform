package org.tduc.scheduleservice.dto.request;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.scheduleservice.model.ScheduleStatus;

import java.time.ZonedDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleCreationRequest {
    @NotNull(message = "userId cannot be null")
    String userId;
    List<String> collaborators;
    @NotNull(message = "title cannot be null")
    String title;
    @NotNull(message = "startTime cannot be null")
    ZonedDateTime startTime;
    @NotNull(message = "endTime cannot be null")
    ZonedDateTime endTime;
    // Quy tắc lặp (RRULE, iCal format)
    @Column(columnDefinition = "TEXT")
    String recurrenceRule;
    // Room code for classroom service - optional
    String roomCode;
}
