
package org.tduc.scheduleservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.tduc.scheduleservice.dto.request.ScheduleCreationRequest;
import org.tduc.scheduleservice.dto.request.ScheduleEditRequest;
import org.tduc.scheduleservice.dto.request.ScheduleParticipantCreationRequest;
import org.tduc.scheduleservice.dto.response.ScheduleCreationResponse;
import org.tduc.scheduleservice.dto.response.ScheduleParticipantCreationResponse;
import org.tduc.scheduleservice.model.Schedule;
import org.tduc.scheduleservice.model.ScheduleParticipant;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ScheduleMapper {
    Schedule toSchedule(ScheduleCreationRequest request);
    @Mapping(source = "id", target = "courseId")
    @Mapping(source = "userId", target = "teacherId")
    ScheduleCreationResponse toScheduleCreationResponse(Schedule schedule);
    void updateSchedule (@MappingTarget Schedule schedule, ScheduleEditRequest request);

    ScheduleParticipant toScheduleParticipant(ScheduleParticipantCreationRequest request);
    ScheduleParticipantCreationResponse toScheduleParticipantCreationResponse(Schedule schedule);

}