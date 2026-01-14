# Java Backend Service Test Summary

## ApiGateway

Integration Tests (ApiGatewayApplicationTests.java):
- testUserProfileRoute: Route to user profile endpoint. Expected: Status 200, correct user data.
- testClassroomTokenRoute: Route to classroom token endpoint. Expected: Status 200, token returned.
- testDownstreamErrorPropagation: Error from downstream service is propagated. Expected: Status 5xx error.

## HomeworkService

Unit & Integration Tests:
SubmissionServiceTest.java:
- createSubmission_happyPath_createsSubmission: Create submission with valid data. Expected: Submission created, ID returned.
- createSubmission_homeworkNotPublished_throws: Submission to unpublished homework throws error. Expected: Exception with HOMEWORK_NOT_PUBLISHED.
- gradeSubmission_validScore_appliesLatePenaltyWhenLate: Grade late submission applies penalty. Expected: Score reduced by penalty.
- getSubmission_notFound_throws: Get missing submission throws error. Expected: Exception with SUBMISSION_NOT_FOUND.

HomeworkServiceTest.java:
- createHomework_happyPath_setsCreatedByAndSaves: Create homework with valid data. Expected: Homework created, saved.
- createHomework_invalidDueDate_throws: Create homework with past due date throws error. Expected: Exception with INVALID_DUE_DATE.
- publishHomework_happyPath_updatesStatus: Publish homework before due date. Expected: Status updated to published.
- publishHomework_pastDueDate_throws: Publish homework after due date throws error. Expected: Exception with INVALID_DUE_DATE.
- getHomework_notFound_throws: Get missing homework throws error. Expected: Exception with HOMEWORK_NOT_FOUND.

HomeworkServiceApplicationTests.java:
- contextLoads: Application context load test. Expected: Spring context loads without error.

## ScheduleService

Unit & Integration Tests:
ScheduleParticipantServiceTest.java:
- createScheduleParticipant_resolveUsernameAndJoin_succeeds: Join schedule with username resolves and succeeds. Expected: Participant created, userId resolved.
- createScheduleParticipant_noSchedule_throws: Join with invalid join code throws error. Expected: Exception with SCHEDULE_NOT_FOUND.
- createScheduleParticipant_alreadyJoined_throws: Join when already joined throws error. Expected: Exception with USER_ALREADY_JOINED.

ScheduleServiceApplicationTests.java:
- contextLoads: Application context load test. Expected: Spring context loads without error.

## AnnouncementService

Unit Test:
AnnouncementServiceApplicationTests.java:
- contextLoads: Application context load test. Expected: Spring context loads without error.


This summary lists all unit and integration tests found in the main Java backend services. For details, see the respective test files in each service's src/test/java directory.


============================
How to Run the Project
============================

1. Start All Services with Docker (Recommended):
	cd "d:\phat\A-microservices-based-e-learning-platform"
	docker-compose up --build -d

2. Access the Application:
	- Frontend:           http://localhost
	- API Gateway:        http://localhost:8888
	- All APIs:           http://localhost:8888/api/...

3. Demo Accounts:
	| Role    | Username  | Password   |
	|---------|-----------|------------|
	| Admin   | admin     | admin123   |
	| Teacher | teacher1  | teacher123 |
	| Student | student1  | student123 |

4. Run Tests:
	- For Java services:   ./mvnw test
	- For Node.js services: npm test
	- For Frontend:        npm run test

5. Development Mode (run services individually):
	docker-compose up mysql redis -d
	# Then run each service in your IDE/terminal

6. Check Service Health:
	docker-compose ps
	curl http://localhost:8888/actuator/health  # API Gateway
	curl http://localhost:8080/actuator/health  # User Service
	curl http://localhost:8081/actuator/health  # Homework Service


