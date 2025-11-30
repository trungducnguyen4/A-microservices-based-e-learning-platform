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
    String userId;
    @Column(nullable = false)
    String joinCode;
    // Optional: incoming Authorization header passed from controller so service can call UserService
    // Not persisted; used only for resolving username -> userId when needed.
    String authHeader;
}
