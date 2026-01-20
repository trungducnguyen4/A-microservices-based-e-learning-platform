package org.tduc.scheduleservice1.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinClassroomResponse {
    private String scheduleId;
    private String title;
    private String joinCode; // joinCode = roomCode for LiveKit
    private boolean isTeacher;
    private boolean canJoin;
    private String message;
    private boolean teacherJoined;
}
