package org.tduc.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.List;

@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    // Các endpoint không cần authentication
    private static final List<String> EXCLUDED_PATHS = List.of(
        "/api/users/login",
        "/api/users/register",
        "/actuator/health",
        "/api/users/auth/login",
        "/api/users/auth/register"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        log.info("Processing request to: {}", path);

        // Bỏ qua authentication cho các endpoint public
        if (isExcludedPath(path)) {
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
        return EXCLUDED_PATHS.stream().anyMatch(path::startsWith) ||
               path.startsWith("/api/public/") ||
               path.equals("/") ||
               path.startsWith("/static/") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.startsWith("/images/");
    }

    private String getJwtFromRequest(ServerHttpRequest request) {
        String bearerToken = request.getHeaders().getFirst("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
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