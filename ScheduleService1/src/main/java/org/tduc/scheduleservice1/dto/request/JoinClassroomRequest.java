package org.tduc.scheduleservice1.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinClassroomRequest {
    @NotBlank(message = "Join code is required")
    private String joinCode;
}
