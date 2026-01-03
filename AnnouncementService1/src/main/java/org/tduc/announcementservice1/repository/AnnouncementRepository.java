package org.tduc.announcementservice1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.tduc.announcementservice1.model.Announcement;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, String> {
    List<Announcement> findByCourseIdOrderByCreatedAtDesc(String courseId);
}
