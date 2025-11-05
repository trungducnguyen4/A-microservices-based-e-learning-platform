// src/main/java/org/tduc/userservice/config/WebConfig.java
package org.tduc.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // CORS will be handled centrally by the API Gateway. Keep this bean minimal to avoid service-level CORS.
        return new WebMvcConfigurer() {
        };
    }
}