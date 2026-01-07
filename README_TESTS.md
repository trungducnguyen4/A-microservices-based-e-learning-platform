# Java Backend Service Test Summary

## ApiGateway

### Integration Tests (ApiGatewayApplicationTests.java)
| Test Name                        | Description                                             | Expected Result                | Actual Result (Example)      |
|----------------------------------|---------------------------------------------------------|--------------------------------|------------------------------|
| testUserProfileRoute             | Route to user profile endpoint                          | Status 200, correct user data  | Status 200, correct user data|
| testClassroomTokenRoute          | Route to classroom token endpoint                       | Status 200, token returned     | Status 200, token returned   |
| testDownstreamErrorPropagation   | Error from downstream service is propagated             | Status 5xx error               | Status 5xx error             |


## HomeworkService

### Unit & Integration Tests
#### SubmissionServiceTest.java
| Test Name                                         | Description                                             | Expected Result                        | Actual Result (Example)         |
|---------------------------------------------------|---------------------------------------------------------|----------------------------------------|---------------------------------|
| createSubmission_happyPath_createsSubmission      | Create submission with valid data                       | Submission created, ID returned        | All assertions pass             |
| createSubmission_homeworkNotPublished_throws      | Submission to unpublished homework throws error         | Exception with HOMEWORK_NOT_PUBLISHED  | Exception thrown                 |
| gradeSubmission_validScore_appliesLatePenaltyWhenLate | Grade late submission applies penalty               | Score reduced by penalty               | All assertions pass             |
| getSubmission_notFound_throws                     | Get missing submission throws error                     | Exception with SUBMISSION_NOT_FOUND    | Exception thrown                 |

#### HomeworkServiceTest.java
| Test Name                                         | Description                                             | Expected Result                        | Actual Result (Example)         |
|---------------------------------------------------|---------------------------------------------------------|----------------------------------------|---------------------------------|
| createHomework_happyPath_setsCreatedByAndSaves    | Create homework with valid data                         | Homework created, saved                | All assertions pass             |
| createHomework_invalidDueDate_throws              | Create homework with past due date throws error         | Exception with INVALID_DUE_DATE        | Exception thrown                 |
| publishHomework_happyPath_updatesStatus           | Publish homework before due date                        | Status updated to published            | All assertions pass             |
| publishHomework_pastDueDate_throws                | Publish homework after due date throws error            | Exception with INVALID_DUE_DATE        | Exception thrown                 |
| getHomework_notFound_throws                       | Get missing homework throws error                       | Exception with HOMEWORK_NOT_FOUND      | Exception thrown                 |

#### HomeworkServiceApplicationTests.java
| Test Name         | Description                        | Expected Result                        | Actual Result (Example)         |
|-------------------|------------------------------------|----------------------------------------|---------------------------------|
| contextLoads      | Application context load test       | Spring context loads without error     | Context loads successfully       |

## ScheduleService

### Unit & Integration Tests
#### ScheduleParticipantServiceTest.java
| Test Name                                             | Description                                             | Expected Result                        | Actual Result (Example)         |
|-------------------------------------------------------|---------------------------------------------------------|----------------------------------------|---------------------------------|
| createScheduleParticipant_resolveUsernameAndJoin_succeeds | Join schedule with username resolves and succeeds   | Participant created, userId resolved   | All assertions pass             |
| createScheduleParticipant_noSchedule_throws           | Join with invalid join code throws error                | Exception with SCHEDULE_NOT_FOUND      | Exception thrown                 |
| createScheduleParticipant_alreadyJoined_throws        | Join when already joined throws error                   | Exception with USER_ALREADY_JOINED     | Exception thrown                 |

#### ScheduleServiceApplicationTests.java
| Test Name         | Description                        | Expected Result                        | Actual Result (Example)         |
|-------------------|------------------------------------|----------------------------------------|---------------------------------|
| contextLoads      | Application context load test       | Spring context loads without error     | Context loads successfully       |

## AnnouncementService

### Unit Test
#### AnnouncementServiceApplicationTests.java
| Test Name         | Description                        | Expected Result                        | Actual Result (Example)         |
|-------------------|------------------------------------|----------------------------------------|---------------------------------|
| contextLoads      | Application context load test       | Spring context loads without error     | Context loads successfully       |

---

This summary lists all unit and integration tests found in the main Java backend services. The table above visualizes sample expected and actual results for integration tests in ApiGateway. For details, see the respective test files in each service's `src/test/java` directory.
