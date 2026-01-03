package org.tduc.announcementservice1.service;

import org.tduc.announcementservice1.dto.request.AnnouncementCreationRequest;
import org.tduc.announcementservice1.dto.response.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {
    AnnouncementResponse createAnnouncement(AnnouncementCreationRequest request, String creatorId);
    List<AnnouncementResponse> getAnnouncementsByCourse(String courseId);
    AnnouncementResponse getAnnouncement(String id);
    void deleteAnnouncement(String id);
}
