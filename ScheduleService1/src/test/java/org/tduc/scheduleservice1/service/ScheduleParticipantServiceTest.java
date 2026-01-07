// ...existing code...
package org.tduc.scheduleservice1.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.tduc.scheduleservice1.dto.request.ScheduleParticipantCreationRequest;
import org.tduc.scheduleservice1.exception.AppException;
import org.tduc.scheduleservice1.exception.ErrorCode;
import org.tduc.scheduleservice1.model.Schedule;
import org.tduc.scheduleservice1.model.ScheduleParticipant;
import org.tduc.scheduleservice1.repository.ScheduleParticipantRepository;
import org.tduc.scheduleservice1.repository.ScheduleRepository;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ScheduleParticipantService (ScheduleService1).
 * These are unit tests (no Spring context) using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class ScheduleParticipantServiceTest {

    @Mock
    private ScheduleParticipantRepository scheduleParticipantRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private org.tduc.scheduleservice1.service.ScheduleParticipantService scheduleParticipantService;

    private ScheduleParticipantCreationRequest req;

    @BeforeEach
    void setUp() {
        req = new ScheduleParticipantCreationRequest();
        req.setJoinCode("JOIN123");
        req.setUserId("studentName"); // non-UUID triggers resolution
    }

    @Test
    void createScheduleParticipant_resolveUsernameAndJoin_succeeds() {
        Schedule schedule = new Schedule();
        schedule.setId("sched-1");
        when(scheduleRepository.findByJoinCode("JOIN123")).thenReturn(Optional.of(schedule));

        // Mock user service response: {"result": {"id": "user-1"}}
        Map<String, Object> result = Map.of("id", "user-1");
        Map<String, Object> resp = Map.of("result", result);
        when(restTemplate.exchange(anyString(), any(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(resp));

        when(scheduleParticipantRepository.existsByScheduleIdAndUserId("sched-1", "user-1")).thenReturn(false);
        when(scheduleParticipantRepository.save(any(ScheduleParticipant.class))).thenAnswer(i -> i.getArgument(0));

        ScheduleParticipant saved = scheduleParticipantService.createScheduleParticipant(req);

        assertThat(saved).isNotNull();
        assertThat(saved.getScheduleId()).isEqualTo("sched-1");
        assertThat(saved.getUserId()).isEqualTo("user-1");
    }

    @Test
    void createScheduleParticipant_noSchedule_throws() {
        when(scheduleRepository.findByJoinCode("JOIN123")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> scheduleParticipantService.createScheduleParticipant(req))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SCHEDULE_NOT_FOUND);
    }

    @Test
    void createScheduleParticipant_alreadyJoined_throws() {
        Schedule schedule = new Schedule();
        schedule.setId("sched-1");
        when(scheduleRepository.findByJoinCode("JOIN123")).thenReturn(Optional.of(schedule));
        when(scheduleParticipantRepository.existsByScheduleIdAndUserId("sched-1", "studentName")).thenReturn(true);

        assertThatThrownBy(() -> scheduleParticipantService.createScheduleParticipant(req))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_ALREADY_JOINED);
    }

}
// ...existing code...
