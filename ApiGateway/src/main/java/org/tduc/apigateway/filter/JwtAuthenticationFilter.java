package org.tduc.apigateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;

@Component
@Order(0)
public class JwtAuthenticationFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    // try to read your configured secret / public key (adjust property names to your project)
    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.public-key:}")
    private String jwtPublicKeyPem;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String token = resolveToken(exchange);
        if (token != null) {
            try {
                // validate token and extract claims for downstream services
                Map<String, Object> claims = validateTokenAndAuthenticate(token);

                // If we have claims, propagate minimal user info as headers so downstream
                // services can create authentication from headers.
                if (claims != null) {
                    // Prefer an explicit "userId" claim if present (newer tokens include UUID id).
                    // Fallback to subject for legacy tokens which stored username or numeric id in sub.
                    String userId = claims.containsKey("userId") ? claims.get("userId").toString() : claims.getOrDefault("sub", "").toString();
                    String username = claims.containsKey("username") ? claims.get("username").toString() : (userId != null ? userId : "");
                    String role = "";
                    if (claims.containsKey("role")) role = claims.get("role").toString();
                    else if (claims.containsKey("roles")) role = claims.get("roles").toString();

            // Log what we will propagate to downstream services for easier debugging
            log.info("Propagating headers -> X-User-Id: {}, X-User-Username: {}, X-User-Role: {}", userId, username, role);
            ServerHttpRequest modified = exchange.getRequest().mutate()
                .header("X-User-Id", userId)
                .header("X-User-Username", username)
                .header("X-User-Role", role)
                .build();

                    ServerWebExchange mutatedExchange = exchange.mutate().request(modified).build();
                    return chain.filter(mutatedExchange);
                }
            } catch (Exception ex) {
                log.error("Error validating JWT token: {}", ex.getMessage());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        }
        return chain.filter(exchange);
    }

    private String resolveToken(ServerWebExchange exchange) {
        String auth = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        return null;
    }

    private Map<String, Object> validateTokenAndAuthenticate(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT format");
        }

        String headerB64 = parts[0];
        String payloadB64 = parts[1];
        String tokenSignatureB64 = parts[2];

        // Log raw parts (base64url). Be careful in production with PII.
        log.info("JWT header (base64url): {}", headerB64);
        log.info("JWT payload (base64url): {}", payloadB64);
        log.info("JWT signature (from token, base64url): {}", tokenSignatureB64);

        // parse header to detect alg / kid
        byte[] headerBytes = base64UrlDecode(headerB64);
        Map<String, Object> header = mapper.readValue(headerBytes, Map.class);
        String alg = (String) header.getOrDefault("alg", "unknown");
        String kid = (String) header.getOrDefault("kid", null);
        log.info("JWT alg: {}, kid: {}", alg, kid);

        // compute expected signature when using HMAC (HS*) and secret available
        if (alg != null && alg.startsWith("HS") && jwtSecret != null && !jwtSecret.isEmpty()) {
            String signingInput = headerB64 + "." + payloadB64;
            String expectedSig = computeHmacBase64Url(signingInput, jwtSecret, alg);
            log.info("Locally computed signature (base64url): {}", expectedSig);
            if (!constantTimeEquals(expectedSig, tokenSignatureB64)) {
                throw new IllegalArgumentException("JWT signature does not match locally computed signature. JWT validity cannot be asserted and should not be trusted.");
            }
            // signature valid — parse and return payload claims
            byte[] payloadBytes = base64UrlDecode(payloadB64);
            Map<String, Object> payload = mapper.readValue(payloadBytes, Map.class);
            return payload;
        } else if (alg != null && (alg.startsWith("RS") || alg.startsWith("ES"))) {
            // For asymmetric algorithms we usually verify with a public key.
            // We cannot compute the expected signature without the private key.
            if (jwtPublicKeyPem != null && !jwtPublicKeyPem.isEmpty()) {
                byte[] pubBytes = jwtPublicKeyPem.getBytes(StandardCharsets.UTF_8);
                String pubThumb = sha256Hex(pubBytes);
                log.info("Configured public key fingerprint (sha256 hex): {}", pubThumb);
            } else {
                log.info("No configured public key found in properties; cannot compute expected signature for {}.", alg);
            }
            // actual verification with public key should happen elsewhere; throw to show mismatch
            throw new IllegalArgumentException("JWT signature does not match locally computed signature. JWT validity cannot be asserted and should not be trusted.");
        } else {
            log.info("No local signer information available to compute expected signature (alg: {}, secret present: {}).", alg, (jwtSecret != null && !jwtSecret.isEmpty()));
            throw new IllegalArgumentException("Unable to validate JWT signature locally.");
        }
    }

    private static byte[] base64UrlDecode(String input) {
        return Base64.getUrlDecoder().decode(input);
    }

    private static String computeHmacBase64Url(String signingInput, String secret, String alg) throws Exception {
        String macAlg;
        if ("HS256".equals(alg)) macAlg = "HmacSHA256";
        else if ("HS384".equals(alg)) macAlg = "HmacSHA384";
        else if ("HS512".equals(alg)) macAlg = "HmacSHA512";
        else throw new IllegalArgumentException("Unsupported HMAC alg: " + alg);

        Mac mac = Mac.getInstance(macAlg);
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), macAlg));
        byte[] sig = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "<error>";
        }
    }

    // constant time comparison to avoid timing attacks
    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] aa = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        if (aa.length != bb.length) return false;
        int result = 0;
        for (int i = 0; i < aa.length; i++) result |= aa[i] ^ bb[i];
        return result == 0;
    }
}
