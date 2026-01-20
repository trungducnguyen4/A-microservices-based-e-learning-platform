package org.tduc.scheduleservice1.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.GenericGenerator;

import java.time.ZonedDateTime;
import java.util.List;

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
    
    // No course reference needed here; joinCode is used to join schedules

    @Column(nullable = false)
    String userId;
    List<String> collaborators;
    @Column(nullable = false)
    String title;
    @Column(nullable = false)
    ZonedDateTime startTime;
    @Column(nullable = false)
    String joinCode; // Join code = Room code for LiveKit classroom
    @Column(nullable = false)
    ZonedDateTime endTime;
    // Quy tắc lặp (RRULE, iCal format)
    @Column(columnDefinition = "TEXT")
    String recurrenceRule;
}
