package org.tduc.announcementservice1.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.tduc.announcementservice1.dto.request.AnnouncementCreationRequest;
import org.tduc.announcementservice1.dto.response.AnnouncementResponse;
import org.tduc.announcementservice1.model.Announcement;
import org.tduc.announcementservice1.repository.AnnouncementRepository;
import org.tduc.announcementservice1.service.AnnouncementService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository repository;

    @Override
    public AnnouncementResponse createAnnouncement(AnnouncementCreationRequest request, String creatorId) {
        Announcement a = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .courseId(request.getCourseId())
                .attachments(request.getAttachments())
                .createdBy(creatorId)
                .pinned(request.getPinned() != null ? request.getPinned() : false)
                .build();

        Announcement saved = repository.save(a);
        return toResponse(saved);
    }

    @Override
    public List<AnnouncementResponse> getAnnouncementsByCourse(String courseId) {
        return repository.findByCourseIdOrderByCreatedAtDesc(courseId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public AnnouncementResponse getAnnouncement(String id) {
        return repository.findById(id).map(this::toResponse).orElse(null);
    }

    @Override
    public void deleteAnnouncement(String id) {
        repository.deleteById(id);
    }

    private AnnouncementResponse toResponse(Announcement a) {
        return AnnouncementResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .courseId(a.getCourseId())
                .attachments(a.getAttachments())
                .createdBy(a.getCreatedBy())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .pinned(a.getPinned())
                .build();
    }
}
