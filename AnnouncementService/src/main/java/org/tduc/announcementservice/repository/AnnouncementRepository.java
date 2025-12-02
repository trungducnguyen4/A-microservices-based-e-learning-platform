package org.tduc.announcementservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.announcementservice.model.Announcement;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, String> {
    List<Announcement> findByCourseIdOrderByCreatedAtDesc(String courseId);
}
