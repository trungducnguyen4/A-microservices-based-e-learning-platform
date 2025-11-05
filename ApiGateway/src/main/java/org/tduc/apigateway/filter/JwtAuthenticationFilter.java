package org.tduc.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import java.nio.charset.StandardCharsets;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    // Các endpoint không cần authentication
    private static final List<String> EXCLUDED_PATHS = List.of(
        "/api/users/login",
        "/api/users/register",
        "/actuator/health",
        "/api/users/auth/login",
        "/api/users/auth/register",
        "/api/public/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Allow CORS preflight requests to pass through without authentication
        if (request.getMethod() != null && request.getMethod().equals(HttpMethod.OPTIONS)) {
            log.debug("Allowing preflight OPTIONS request to: {}", path);
            return chain.filter(exchange);
        }

        log.info("Processing request to: {}", path);

        // Bỏ qua authentication cho các endpoint public
        if (isExcludedPath(path)) {
            log.debug("Request to {} matched excluded path, skipping authentication", path);
            return chain.filter(exchange);
        }

        // Lấy JWT token từ header
        String token = getJwtFromRequest(request);
        
        if (!StringUtils.hasText(token)) {
            log.warn("No JWT token found in request to: {}", path);
            return onError(exchange, "Missing authentication token", HttpStatus.UNAUTHORIZED);
        }

        try {
            // Validate JWT token
            Claims claims = validateToken(token);
            
            // Thêm user info vào header để microservices sử dụng
            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
                .header("X-User-Username", claims.get("username", String.class))
                .build();

            log.info("Successfully authenticated user: {} with role: {}", 
                claims.get("username"), claims.get("role"));

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
            
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return onError(exchange, "Invalid authentication token", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isExcludedPath(String path) {
    if (path == null) return false;
    String p = path.toLowerCase();

    // Direct matches or prefix matches for excluded paths
    boolean matched = EXCLUDED_PATHS.stream()
        .map(String::toLowerCase)
        .anyMatch(ex -> p.equals(ex) || p.startsWith(ex) || p.startsWith(ex.endsWith("/") ? ex : ex + "/"));

    if (matched) return true;

    // Common public/static prefixes
    return p.startsWith("/api/public/") || p.equals("/") || p.startsWith("/static/") || p.startsWith("/css/") || p.startsWith("/js/") || p.startsWith("/images/");
    }

    private String getJwtFromRequest(ServerHttpRequest request) {
        String bearerToken = request.getHeaders().getFirst("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private Claims validateToken(String token) {
        try {
            byte[] keyBytes;
            try {
                keyBytes = Decoders.BASE64.decode(jwtSecret);
            } catch (IllegalArgumentException ex) {
                // jwtSecret was not base64 encoded, fall back to raw bytes
                log.debug("JWT secret is not base64-encoded, using raw UTF-8 bytes");
                keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            }

            SecretKey key = Keys.hmacShaKeyFor(keyBytes);
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            log.error("Error validating JWT token: {}", e.getMessage());
            throw e;
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().add("Content-Type", "application/json");
        
        String body = String.format("{\"error\": \"%s\", \"status\": %d}", err, httpStatus.value());
        
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    @Override
    public int getOrder() {
        return -1; // Ưu tiên cao nhất
    }
}