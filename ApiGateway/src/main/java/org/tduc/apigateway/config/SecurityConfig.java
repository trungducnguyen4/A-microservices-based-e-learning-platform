package org.tduc.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
// CORS is configured centrally in `CorsConfig`; do not define another CorsWebFilter here.

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = new String[] {
            "/api/users/auth/login",
            "/api/users/register",
            "/api/users/auth/register",
            "/actuator/**",
            "/api/public/**"
    };

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(csrf -> csrf.disable())
                                .cors(cors -> {})
                .authorizeExchange(authz -> authz
                        .pathMatchers(PUBLIC_PATHS).permitAll()
                        // include a pattern for OPTIONS so the overload matches
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyExchange().permitAll()
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable());

        return http.build();
    }

}