package org.tduc.scheduleservice.dto.response;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.tduc.scheduleservice.model.ScheduleStatus;

import java.time.ZonedDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleCreationResponse {
    String courseId;
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    // 2. Thời gian
    ZonedDateTime startTime;
    ZonedDateTime endTime;
    Integer duration; // phút hoặc giờ, tùy cách tính
    String recurrenceRule; // ISO RRULE format
    String timeZone;

    // 3. Người tham gia
    String teacherId;  // tham chiếu User Service
    Integer maxParticipants;
    
    // Current number of enrolled participants — populated by controller/service when returning responses
    Integer enrolledStudents;

    // 4. Trạng thái & quản lý
    @Enumerated(EnumType.STRING)
    ScheduleStatus status;

    ZonedDateTime createdAt;
    ZonedDateTime updatedAt;
    String createdBy;
}
