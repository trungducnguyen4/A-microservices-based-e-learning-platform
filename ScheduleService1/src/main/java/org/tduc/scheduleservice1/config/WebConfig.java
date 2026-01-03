// src/main/java/org/tduc/userservice/config/WebConfig.java
package org.tduc.scheduleservice1.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.client.RestTemplate;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // CORS is handled by the API Gateway. Keep service-level config minimal to avoid conflicts.
        return new WebMvcConfigurer() {
        };
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
