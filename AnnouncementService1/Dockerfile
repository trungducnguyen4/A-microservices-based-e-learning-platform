# Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder

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
FROM eclipse-temurin:21-jre-alpine

# Basic tools for health checks
RUN apk add --no-cache curl

# Add non-root user
RUN addgroup -g 1001 -S appgroup && \
	adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy JAR from build stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Start Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
