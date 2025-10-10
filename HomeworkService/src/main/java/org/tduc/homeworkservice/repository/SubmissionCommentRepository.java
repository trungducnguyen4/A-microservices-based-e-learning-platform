package org.tduc.homeworkservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.tduc.homeworkservice.model.SubmissionComment;

import java.util.List;

@Repository
public interface SubmissionCommentRepository extends JpaRepository<SubmissionComment, String> {
    
    List<SubmissionComment> findBySubmissionIdOrderByCreatedAtDesc(String submissionId);
    
    List<SubmissionComment> findByCommentByOrderByCreatedAtDesc(String commentBy);
    
    Long countBySubmissionId(String submissionId);
    
    List<SubmissionComment> findBySubmissionIdAndIsPrivateOrderByCreatedAtDesc(String submissionId, Boolean isPrivate);
}