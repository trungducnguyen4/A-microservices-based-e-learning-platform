package org.tduc.homeworkservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "org.tduc.homeworkservice.repository")
@EnableJpaAuditing
@EnableTransactionManagement
public class DatabaseConfig {
    // JPA configuration is handled by Spring Boot auto-configuration
    // This class is mainly for enabling JPA features and setting base packages
}