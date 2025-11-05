// src/main/java/org/tduc/userservice/config/WebConfig.java
package org.tduc.scheduleservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // CORS is handled by the API Gateway. Keep service-level config minimal to avoid conflicts.
        return new WebMvcConfigurer() {
        };
    }
}