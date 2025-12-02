# AnnouncementService

Lightweight announcement microservice for class/course notifications.

Run in dev:

```
cd AnnouncementService
./mvnw.cmd clean package -DskipTests
./mvnw.cmd spring-boot:run
```

API:

- `POST /api/announcements`
- `GET /api/announcements/course/{courseId}`
