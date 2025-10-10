package org.tduc.homeworkservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.tduc.homeworkservice.model.HomeworkAttachment;

import java.util.List;

@Repository
public interface HomeworkAttachmentRepository extends JpaRepository<HomeworkAttachment, String> {
    
    List<HomeworkAttachment> findByHomeworkIdOrderByCreatedAtAsc(String homeworkId);
    
    Long countByHomeworkId(String homeworkId);
    
    List<HomeworkAttachment> findByUploadedByOrderByCreatedAtDesc(String uploadedBy);
}