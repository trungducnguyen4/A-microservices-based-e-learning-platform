package org.tduc.homeworkservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.tduc.homeworkservice.model.SubmissionFile;

import java.util.List;

@Repository
public interface SubmissionFileRepository extends JpaRepository<SubmissionFile, String> {
    
    List<SubmissionFile> findBySubmissionIdOrderByFileOrderAsc(String submissionId);
    
    Long countBySubmissionId(String submissionId);
    
    void deleteBySubmissionId(String submissionId);
}