package org.tduc.homeworkservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.tduc.homeworkservice.dto.request.SubmissionCreationRequest;
import org.tduc.homeworkservice.dto.response.SubmissionResponse;
import org.tduc.homeworkservice.model.Submission;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface SubmissionMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "homework", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "submittedAt", ignore = true)
    @Mapping(target = "gradedAt", ignore = true)
    @Mapping(target = "score", ignore = true)
    @Mapping(target = "percentage", ignore = true)
    @Mapping(target = "letterGrade", ignore = true)
    @Mapping(target = "feedback", ignore = true)
    @Mapping(target = "gradedBy", ignore = true)
    @Mapping(target = "isLate", ignore = true)
    @Mapping(target = "minutesLate", ignore = true)
    @Mapping(target = "latePenaltyApplied", ignore = true)
    @Mapping(target = "plagiarismResult", ignore = true)
    @Mapping(target = "similarityScore", ignore = true)
    @Mapping(target = "peerReviewAssignments", ignore = true)
    @Mapping(target = "peerReviewScores", ignore = true)
    @Mapping(target = "comments", ignore = true)
    @Mapping(target = "files", ignore = true)
    @Mapping(source = "attachmentIds", target = "attachments", qualifiedByName = "listToJson")
    Submission toSubmission(SubmissionCreationRequest request);
    
    @Mapping(source = "homework.id", target = "homeworkId")
    @Mapping(target = "files", ignore = true)
    @Mapping(target = "comments", ignore = true)
    SubmissionResponse toSubmissionResponse(Submission submission);
    
    List<SubmissionResponse> toSubmissionResponseList(List<Submission> submissions);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "homework", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "comments", ignore = true)
    @Mapping(target = "files", ignore = true)
    void updateSubmissionFromRequest(SubmissionCreationRequest request, @MappingTarget Submission submission);
    
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