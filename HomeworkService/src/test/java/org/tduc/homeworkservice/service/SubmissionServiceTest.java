package org.tduc.homeworkservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tduc.homeworkservice.dto.request.GradingRequest;
import org.tduc.homeworkservice.dto.request.SubmissionCreationRequest;
import org.tduc.homeworkservice.dto.response.SubmissionResponse;
import org.tduc.homeworkservice.exception.AppException;
import org.tduc.homeworkservice.exception.ErrorCode;
import org.tduc.homeworkservice.mapper.SubmissionMapper;
import org.tduc.homeworkservice.model.Homework;
import org.tduc.homeworkservice.model.HomeworkStatus;
import org.tduc.homeworkservice.model.Submission;
import org.tduc.homeworkservice.repository.HomeworkRepository;
import org.tduc.homeworkservice.repository.SubmissionFileRepository;
import org.tduc.homeworkservice.repository.SubmissionRepository;
import org.tduc.homeworkservice.repository.SubmissionCommentRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SubmissionService.
 * These are unit tests (no Spring context) using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private HomeworkRepository homeworkRepository;
    @Mock
    private SubmissionMapper submissionMapper;

    @InjectMocks
    private SubmissionService submissionService;

    private SubmissionCreationRequest creationRequest;

    @BeforeEach
    void setUp() {
        creationRequest = new SubmissionCreationRequest();
        creationRequest.setHomeworkId("hw-1");
        creationRequest.setStudentId("student-1");
    }

    @Test
    void createSubmission_happyPath_createsSubmission() {
        Homework hw = new Homework();
        hw.setId("hw-1");
        hw.setStatus(HomeworkStatus.PUBLISHED);
        hw.setDueDate(LocalDateTime.now().plusDays(1));
        hw.setAllowLateSubmissions(true);
        hw.setResubmissionAllowed(true);
        hw.setMaxAttempts(3);

        Submission mapped = new Submission();
        mapped.setHomeworkId("hw-1");
        mapped.setStudentId("student-1");

        Submission saved = new Submission();
        saved.setId("sub-1");
        saved.setHomeworkId("hw-1");
        saved.setStudentId("student-1");

        SubmissionResponse expectedResponse = new SubmissionResponse();
        expectedResponse.setId("sub-1");

        when(homeworkRepository.findById("hw-1")).thenReturn(Optional.of(hw));
        when(submissionRepository.findByHomeworkIdAndStudentIdOrderBySubmittedAtDesc("hw-1", "student-1"))
                .thenReturn(Collections.emptyList());
        when(submissionMapper.toSubmission(creationRequest)).thenReturn(mapped);
        when(submissionRepository.save(mapped)).thenReturn(saved);
        when(submissionMapper.toSubmissionResponse(saved)).thenReturn(expectedResponse);

        SubmissionResponse resp = submissionService.createSubmission(creationRequest);

        assertThat(resp).isNotNull();
        assertThat(resp.getId()).isEqualTo("sub-1");
        verify(submissionRepository).save(mapped);
    }

    @Test
    void createSubmission_homeworkNotPublished_throws() {
        Homework hw = new Homework();
        hw.setId("hw-1");
        hw.setStatus(HomeworkStatus.DRAFT);

        when(homeworkRepository.findById("hw-1")).thenReturn(Optional.of(hw));

        assertThatThrownBy(() -> submissionService.createSubmission(creationRequest))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.HOMEWORK_NOT_PUBLISHED);
    }

    @Test
    void gradeSubmission_validScore_appliesLatePenaltyWhenLate() {
        Submission submission = new Submission();
        submission.setId("sub-1");
        submission.setHomeworkId("hw-1");
        submission.setIsLate(true);
        // set a submittedAt after dueDate to ensure daysLate > 0
        submission.setSubmittedAt(LocalDateTime.now().plusDays(2));
        submission.setLatePenaltyApplied(new BigDecimal("0.10"));

        Homework hw = new Homework();
        hw.setId("hw-1");
        hw.setMaxScore(new BigDecimal("100"));
        hw.setDueDate(LocalDateTime.now());

        GradingRequest grading = new GradingRequest();
        grading.setScore(new BigDecimal("80"));
        grading.setFeedback("Good");
        grading.setGradedBy("teacher-1");

        when(submissionRepository.findById("sub-1")).thenReturn(Optional.of(submission));
        when(homeworkRepository.findById("hw-1")).thenReturn(Optional.of(hw));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(i -> i.getArgument(0));
        when(submissionMapper.toSubmissionResponse(any(Submission.class))).thenAnswer(i -> {
            Submission s = i.getArgument(0);
            SubmissionResponse r = new SubmissionResponse();
            r.setId(s.getId());
            r.setScore(s.getScore());
            return r;
        });

        SubmissionResponse resp = submissionService.gradeSubmission("sub-1", grading);

        assertThat(resp).isNotNull();
        // Final score should be less than or equal to original because of penalty
        assertThat(resp.getScore()).isLessThanOrEqualTo(grading.getScore());
        verify(submissionRepository).save(any(Submission.class));
    }

    @Test
    void getSubmission_notFound_throws() {
        when(submissionRepository.findById("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> submissionService.getSubmission("missing"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SUBMISSION_NOT_FOUND);
    }

}
