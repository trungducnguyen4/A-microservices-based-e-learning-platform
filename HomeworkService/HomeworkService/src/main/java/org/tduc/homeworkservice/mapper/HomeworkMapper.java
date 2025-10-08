package org.tduc.homeworkservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.tduc.homeworkservice.dto.request.HomeworkCreationRequest;
import org.tduc.homeworkservice.dto.response.HomeworkResponse;
import org.tduc.homeworkservice.model.Homework;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface HomeworkMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "submissions", ignore = true)
    @Mapping(target = "homeworkAttachments", ignore = true)
    @Mapping(source = "assignedStudentIds", target = "assignedTo", qualifiedByName = "listToJson")
    @Mapping(source = "groupIds", target = "groupIds", qualifiedByName = "listToJson")
    @Mapping(source = "allowedFileTypes", target = "allowedFileTypes", qualifiedByName = "listToJson")
    @Mapping(source = "tags", target = "tags", qualifiedByName = "listToJson")
    @Mapping(source = "latePenaltyConfig", target = "latePenalty")
    Homework toHomework(HomeworkCreationRequest request);
    
    @Mapping(source = "assignedTo", target = "assignedStudentIds", qualifiedByName = "jsonToList")
    @Mapping(source = "groupIds", target = "groupIds", qualifiedByName = "jsonToList")
    @Mapping(source = "allowedFileTypes", target = "allowedFileTypes", qualifiedByName = "jsonToList")
    @Mapping(source = "tags", target = "tags", qualifiedByName = "jsonToList")
    @Mapping(source = "latePenalty", target = "latePenaltyConfig")
    @Mapping(target = "assignedGroupId", ignore = true)
    @Mapping(target = "totalSubmissions", ignore = true)
    @Mapping(target = "gradedSubmissions", ignore = true)
    @Mapping(target = "pendingSubmissions", ignore = true)
    @Mapping(target = "averageScore", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    HomeworkResponse toHomeworkResponse(Homework homework);
    
    List<HomeworkResponse> toHomeworkResponseList(List<Homework> homeworks);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "submissions", ignore = true)
    @Mapping(target = "homeworkAttachments", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "latePenalty", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(source = "allowedFileTypes", target = "allowedFileTypes", qualifiedByName = "listToJson")
    @Mapping(source = "groupIds", target = "groupIds", qualifiedByName = "listToJson")
    @Mapping(source = "tags", target = "tags", qualifiedByName = "listToJson")
    void updateHomeworkFromRequest(HomeworkCreationRequest request, @MappingTarget Homework homework);
    
    @org.mapstruct.Named("listToJson")
    default String listToJson(List<String> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return String.join(",", list);
    }
    
    @org.mapstruct.Named("jsonToList")
    default List<String> jsonToList(String json) {
        if (json == null || json.isEmpty()) {
            return List.of();
        }
        return List.of(json.split(","));
    }
}