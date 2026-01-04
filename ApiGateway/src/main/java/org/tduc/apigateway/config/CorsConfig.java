package org.tduc.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow the local frontend origins used by the client app
        // Support both HTTP and HTTPS for dev (mkcert) and production
        config.setAllowedOriginPatterns(Arrays.asList(
            // Development - localhost
            "http://localhost:*", 
            "http://127.0.0.1:*",
<<<<<<< HEAD
            "http://13.211.125.143",
            "http://13.211.125.143:*",
=======
            "https://localhost:*",
            "https://127.0.0.1:*",
            
            // Development - LAN (mobile testing)
            "http://192.168.*.*:*",
            "https://192.168.*.*:*",
            
            // Production - academihub.site
>>>>>>> 346cb7943b981faa47343ba51b25be75a898acc1
            "http://academihub.site",
            "http://academihub.site:*",
            "https://academihub.site",
            "https://academihub.site:*",
            "http://*.academihub.site",
            "https://*.academihub.site",
            
            // AWS/Cloud IPs (if needed)
            "http://3.26.171.51",
            "http://3.26.171.51:*",
            "http://3.107.5.21",
            "http://3.107.5.21:*"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
