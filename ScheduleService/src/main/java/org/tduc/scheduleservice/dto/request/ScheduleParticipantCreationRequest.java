package org.tduc.scheduleservice.dto.request;

import jakarta.persistence.Column;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleParticipantCreationRequest {
    @Column(nullable = false)
    String scheduleId;

    @Column(nullable = false)
    String userId;
}
