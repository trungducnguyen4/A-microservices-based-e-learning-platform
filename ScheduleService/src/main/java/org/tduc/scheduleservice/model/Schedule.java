package org.tduc.scheduleservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.GenericGenerator;

import java.time.ZonedDateTime;

@Entity
@Table(name = "schedules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Schedule {

    @Id
    @GeneratedValue(generator = "uuid")
    @GenericGenerator(name = "uuid", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36, updatable = false, nullable = false)
    String id;

    // 1. Các trường cơ bản
    String classroomId;
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

    // 4. Trạng thái & quản lý
    @Enumerated(EnumType.STRING)
    ScheduleStatus status;

    ZonedDateTime createdAt;
    ZonedDateTime updatedAt;
    String createdBy;

    // 5. Tích hợp & tiện ích
//    String meetingLink;
//    String googleCalendarEventId;
//    Integer reminderTime; // phút trước giờ học
//    String tags; // có thể để JSON string hoặc comma-separated
}
