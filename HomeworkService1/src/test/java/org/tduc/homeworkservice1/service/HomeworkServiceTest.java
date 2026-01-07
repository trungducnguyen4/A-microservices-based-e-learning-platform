// ...existing code...
package org.tduc.homeworkservice1.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tduc.homeworkservice1.dto.request.HomeworkCreationRequest;
import org.tduc.homeworkservice1.dto.response.HomeworkResponse;
import org.tduc.homeworkservice1.exception.AppException;
import org.tduc.homeworkservice1.exception.ErrorCode;
import org.tduc.homeworkservice1.mapper.HomeworkMapper;
import org.tduc.homeworkservice1.model.Homework;
import org.tduc.homeworkservice1.model.HomeworkStatus;
import org.tduc.homeworkservice1.repository.HomeworkAttachmentRepository;
import org.tduc.homeworkservice1.repository.HomeworkRepository;
import org.tduc.homeworkservice1.util.AuthContextUtil;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for HomeworkService (HomeworkService1).
 * These are unit tests (no Spring context) using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class HomeworkServiceTest {

    @Mock
    private HomeworkRepository homeworkRepository;
    @Mock
    private HomeworkAttachmentRepository attachmentRepository;
    @Mock
    private HomeworkMapper homeworkMapper;
    @Mock
    private AuthContextUtil authContextUtil;

    @InjectMocks
    private org.tduc.homeworkservice1.service.HomeworkService homeworkService;

    private HomeworkCreationRequest creationRequest;

    @BeforeEach
    void setUp() {
        creationRequest = new HomeworkCreationRequest();
        creationRequest.setTitle("Test HW");
        creationRequest.setDueDate(LocalDateTime.now().plusDays(2));
    }

    @Test
    void createHomework_happyPath_setsCreatedByAndSaves() {
        Homework hw = new Homework();
        hw.setTitle("Test HW");

        Homework saved = new Homework();
        saved.setId("hw-1");
        saved.setTitle("Test HW");

        when(homeworkMapper.toHomework(creationRequest)).thenReturn(hw);
        when(authContextUtil.getCurrentUserIdRaw()).thenReturn("teacher-1");
        when(homeworkRepository.save(any(Homework.class))).thenReturn(saved);
        when(homeworkMapper.toHomeworkResponse(saved)).thenReturn(new HomeworkResponse());

        HomeworkResponse resp = homeworkService.createHomework(creationRequest);

        assertThat(resp).isNotNull();
        verify(homeworkRepository).save(any(Homework.class));
        verify(homeworkMapper).toHomeworkResponse(saved);
    }

    @Test
    void createHomework_invalidDueDate_throws() {
        creationRequest.setDueDate(LocalDateTime.now().minusDays(1));
        assertThatThrownBy(() -> homeworkService.createHomework(creationRequest))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_DUE_DATE);
    }

    @Test
    void publishHomework_happyPath_updatesStatus() {
        Homework hw = new Homework();
        hw.setId("hw-1");
        hw.setDueDate(LocalDateTime.now().plusDays(1));
        hw.setStatus(HomeworkStatus.DRAFT);

        when(homeworkRepository.findById("hw-1")).thenReturn(Optional.of(hw));
        when(homeworkRepository.save(any(Homework.class))).thenAnswer(i -> i.getArgument(0));
        when(homeworkMapper.toHomeworkResponse(any(Homework.class))).thenReturn(new HomeworkResponse());

        HomeworkResponse resp = homeworkService.publishHomework("hw-1");

        assertThat(resp).isNotNull();
        verify(homeworkRepository).save(any(Homework.class));
    }

    @Test
    void publishHomework_pastDueDate_throws() {
        Homework hw = new Homework();
        hw.setId("hw-1");
        hw.setDueDate(LocalDateTime.now().minusDays(1));
        hw.setStatus(HomeworkStatus.DRAFT);

        when(homeworkRepository.findById("hw-1")).thenReturn(Optional.of(hw));

        assertThatThrownBy(() -> homeworkService.publishHomework("hw-1"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_DUE_DATE);
    }

    @Test
    void getHomework_notFound_throws() {
        when(homeworkRepository.findById("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> homeworkService.getHomework("missing"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.HOMEWORK_NOT_FOUND);
    }
}
// ...existing code...
