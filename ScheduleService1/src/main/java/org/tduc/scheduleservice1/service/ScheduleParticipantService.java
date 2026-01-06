package org.tduc.scheduleservice1.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.tduc.scheduleservice1.dto.request.ScheduleParticipantCreationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.tduc.scheduleservice1.exception.AppException;
import org.tduc.scheduleservice1.exception.ErrorCode;
import org.tduc.scheduleservice1.mapper.ScheduleMapper;
import org.tduc.scheduleservice1.model.Schedule;
import org.tduc.scheduleservice1.model.ScheduleParticipant;
import org.tduc.scheduleservice1.repository.ScheduleParticipantRepository;
import org.tduc.scheduleservice1.repository.ScheduleRepository;
// course repository removed — schedules now hold courseCode directly

import java.util.List;
import java.util.Optional; // <-- Add this import
import java.util.stream.Collectors;

import org.tduc.scheduleservice1.dto.response.ScheduleCreationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ScheduleParticipantService {
    private static final Logger log = LoggerFactory.getLogger(ScheduleParticipantService.class);
    @Autowired
    private ScheduleParticipantRepository scheduleParticipantRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private ScheduleMapper scheduleMapper;
    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.user-service.url:https://localhost:8080}")
    private String userServiceUrl;

    public ScheduleParticipant createScheduleParticipant(ScheduleParticipantCreationRequest request) {
        // Resolve username -> userId if the provided userId looks like a username (not UUID)
        String provided = request.getUserId();
        if (provided != null && !provided.isBlank()) {
            // Simple UUID v4 pattern check; if it doesn't match, attempt to resolve via UserService
            String uuidRegex = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
            if (!provided.matches(uuidRegex)) {
                try {
                    // Call UserService profile endpoint to get actual id. Use Authorization header if available.
                    String url = userServiceUrl + "/api/users/profile/" + java.net.URLEncoder.encode(provided, java.nio.charset.StandardCharsets.UTF_8);
                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                    if (request.getAuthHeader() != null && !request.getAuthHeader().isBlank()) {
                        headers.set("Authorization", request.getAuthHeader());
                    }
                    org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
                    java.util.Map response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, java.util.Map.class).getBody();
                    if (response != null && response.get("result") instanceof java.util.Map) {
                        java.util.Map result = (java.util.Map) response.get("result");
                        Object idObj = result.get("id");
                        if (idObj != null) {
                            request.setUserId(idObj.toString());
                            provided = request.getUserId();
                        }
                    }
                } catch (Exception ex) {
                    // If resolution fails, fall back to provided value (username). Log debug and continue.
                    org.slf4j.LoggerFactory.getLogger(ScheduleParticipantService.class).debug("Failed to resolve username to id: {}", ex.getMessage());
                }
            }
        }
    // Find schedule by join code first (trim input to avoid whitespace mismatches)
    String rawCode = request.getJoinCode() == null ? "" : request.getJoinCode().trim();
    log.info("Attempting to join with code='{}' for userId={}", rawCode, request.getUserId());
    Optional<Schedule> optionalSchedule = scheduleRepository.findByJoinCode(rawCode);

        // If not found by joinCode, we fail — joinCode is required to join a schedule
        if (!optionalSchedule.isPresent()) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }

        if (!optionalSchedule.isPresent()) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }

        Schedule schedule = optionalSchedule.get();

        // Check if user already joined
        boolean exists = scheduleParticipantRepository.existsByScheduleIdAndUserId(
                schedule.getId(), request.getUserId());
        if (exists) {
            throw new AppException(ErrorCode.USER_ALREADY_JOINED);
        }

    // Create participant with resolved schedule id and save
    ScheduleParticipant participant = ScheduleParticipant.builder()
        .scheduleId(schedule.getId())
        .userId(request.getUserId())
        .build();
    return scheduleParticipantRepository.save(participant);
    }

    public List<ScheduleParticipant> getScheduleParticipants() {
        return scheduleParticipantRepository.findAll();
    }

    public List<ScheduleParticipant> getParticipantsByScheduleId(String scheduleId) {
        return scheduleParticipantRepository.findByScheduleId(scheduleId);
    }

    /**
     * Get schedules the given user is enrolled in.
     * Returns mapped ScheduleCreationResponse objects.
     */
    public List<ScheduleCreationResponse> getEnrollmentsForUser(Long userId) {
        if (userId == null) return List.of();

        List<ScheduleParticipant> participants = scheduleParticipantRepository.findByUserId(userId.toString());

        return participants.stream()
                .map(p -> scheduleRepository.findById(p.getScheduleId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(scheduleMapper::toScheduleCreationResponse)
                .collect(Collectors.toList());
    }

    /**
     * Variant that accepts a raw user id string (UUID or other string id).
     * Use this when API gateway forwards X-User-Id as UUID.
     */
    public List<ScheduleCreationResponse> getEnrollmentsForUserByString(String userId) {
        if (userId == null || userId.isBlank()) return List.of();

        List<ScheduleParticipant> participants = scheduleParticipantRepository.findByUserId(userId);

        return participants.stream()
                .map(p -> scheduleRepository.findById(p.getScheduleId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(scheduleMapper::toScheduleCreationResponse)
                .collect(Collectors.toList());
    }
}
