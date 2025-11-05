package org.tduc.apigateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestId = UUID.randomUUID().toString();
        
        // Log request
        log.info("Gateway Request ID: {} | Method: {} | URI: {} | Remote Address: {}", 
            requestId,
            request.getMethod(),
            request.getURI(),
            request.getRemoteAddress()
        );

        // Thêm request ID vào header
        ServerHttpRequest modifiedRequest = request.mutate()
            .header("X-Request-ID", requestId)
            .header("X-Request-Time", LocalDateTime.now().toString())
            .build();

        long startTime = System.currentTimeMillis();

        return chain.filter(exchange.mutate().request(modifiedRequest).build())
            .doOnTerminate(() -> {
                ServerHttpResponse response = exchange.getResponse();
                long duration = System.currentTimeMillis() - startTime;
                
                log.info("Gateway Response ID: {} | Status: {} | Duration: {}ms", 
                    requestId,
                    response.getStatusCode(),
                    duration
                );
            });
    }

    @Override
    public int getOrder() {
        return -2; // Chạy trước JwtAuthenticationFilter
    }
}