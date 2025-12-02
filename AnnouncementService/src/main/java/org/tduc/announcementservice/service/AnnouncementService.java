package org.tduc.announcementservice.service;

import org.tduc.announcementservice.dto.request.AnnouncementCreationRequest;
import org.tduc.announcementservice.dto.response.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {
    AnnouncementResponse createAnnouncement(AnnouncementCreationRequest request, String creatorId);
    List<AnnouncementResponse> getAnnouncementsByCourse(String courseId);
    AnnouncementResponse getAnnouncement(String id);
    void deleteAnnouncement(String id);
}
