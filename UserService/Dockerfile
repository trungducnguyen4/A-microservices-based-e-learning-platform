FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper files
COPY .mvn .mvn
COPY mvnw* ./
COPY pom.xml ./

# Make Maven wrapper executable
RUN chmod +x ./mvnw
# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-alpine

# Basic tools for health checks
RUN apk add --no-cache curl

# Add non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
# WORKDIR /app
# COPY --from=builder /app/target/*.jar app.jar

# HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
#   CMD curl -f http://localhost:8080/actuator/health || exit 1

# EXPOSE 8080
# ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
# ===== BUILD STAGE =====
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY .mvn .mvn
COPY mvnw ./
COPY pom.xml ./
RUN chmod +x mvnw

COPY src ./src

RUN ./mvnw clean package -DskipTests

# ===== RUNTIME STAGE =====
FROM eclipse-temurin:17-jre-alpine

RUN apk add --no-cache curl

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java","-jar","app.jar"]
