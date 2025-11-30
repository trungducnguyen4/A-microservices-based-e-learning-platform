package org.tduc.userservice.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.tduc.userservice.dto.request.AuthRequest;
import org.tduc.userservice.dto.request.IntrospectRequest;
import org.tduc.userservice.dto.request.UserCreationRequest;
import org.tduc.userservice.dto.request.UserEditRequest;
import org.tduc.userservice.dto.response.AuthResponse;
import org.tduc.userservice.dto.response.IntrospectResponse;
import org.tduc.userservice.dto.response.UserResponse;
import org.tduc.userservice.exception.AppException;
import org.tduc.userservice.exception.ErrorCode;
import org.tduc.userservice.mapper.UserMapper;
import org.tduc.userservice.repository.UserRepository;
import org.tduc.userservice.model.User;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

// Added imports for bean registration and registry post-processor
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.BeanDefinitionRegistryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.mapstruct.factory.Mappers;

@Service
public class UserService {
    @Autowired
            
    UserRepository userRepository;
    @Autowired
    UserMapper userMapper;
    // Prefer to read signing secret from environment or configuration so gateway and user-service share the same secret.
    // Resolution order: 1) JWT_SECRET env var, 2) jwt.secret property, 3) fallback default (legacy string)
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:${jwt.secret:mysupersecretrandomstringwith32chars!}}")
    private String jwtSecret;

    public AuthResponse authenticate(AuthRequest authRequest) {
        var user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USERNAME_NOT_EXIST));

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        boolean passmatch = passwordEncoder.matches(authRequest.getPassword(), user.getPasswordHash());

        if (!passmatch) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var token = generateToken(user.getUsername());
        return AuthResponse.builder().token(token).authenticated(true).build();
    }
    //    }
    private String generateToken(String username) {
        try {
            byte[] secret = jwtSecret.getBytes(StandardCharsets.UTF_8);
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USERNAME_NOT_EXIST));

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
            // use username as subject because other code expects subject to be username
            .subject(user.getUsername())
            .issuer("duc nguyen")
            .expirationTime(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
            .claim("role", user.getRole())
            .claim("username", user.getUsername())
            // fullName was previously stored under the "email" claim by mistake.
            // Store it under the correct claim name `fullName` and add `userId`.
            .claim("fullName", user.getFullName())
            .claim("userId", user.getId())
            .build();

            JWSObject jwsObject = new JWSObject(header, new Payload(jwtClaimsSet.toJSONObject()));
            jwsObject.sign(new MACSigner(secret));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating JWT", e);
        }
    }
    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            var token = request.getToken();
            JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes(StandardCharsets.UTF_8));
            SignedJWT signedJWT = SignedJWT.parse(token);
            boolean verified = signedJWT.verify(verifier);
            Date expireDate = signedJWT.getJWTClaimsSet().getExpirationTime();
            boolean valid = verified && expireDate.after(new Date());
            return IntrospectResponse.builder()
                    .valid(valid)
                    .build();
        } catch (Exception e) {
            return IntrospectResponse.builder()
                    .valid(false)
                    .build();
        }
    }
    public User findByUsername(String username) {
        return  userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USERNAME_NOT_EXIST));
    }
    //
    public User createRequest(@Valid UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }


        User user = userMapper.toUser(request);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        // Map transient password -> passwordHash column
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPassword()));
        // Clear transient password for safety
        user.setPassword(null);
        return userRepository.save(user);
    }

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public UserResponse getUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse editUser(String userId, @Valid UserEditRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userMapper.updateUser(user, request);
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        userRepository.deleteById(id);
    }
    //

    public UserResponse updateRole(String token, String role) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            String username = signedJWT.getJWTClaimsSet().getSubject();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            user.setRole(role);
            User savedUser = userRepository.save(user);
            return userMapper.toUserResponse(savedUser);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    public UserResponse updateProfile(String token,@Valid UserEditRequest request) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            String username = signedJWT.getJWTClaimsSet().getSubject();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            userMapper.updateUser(user, request); // Update user fields
            User savedUser = userRepository.save(user);
            return userMapper.toUserResponse(savedUser);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    /**
     * Allow a user to choose their role only if they don't already have one.
     * The role must be one of the allowed values (STUDENT, TEACHER, ADMIN).
     */
    public UserResponse chooseRole(String token, String role) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            String username = signedJWT.getJWTClaimsSet().getSubject();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            if (user.getRole() != null && !user.getRole().isBlank()) {
                // Role already assigned
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            String normalized = role == null ? "" : role.trim().toUpperCase();
            if (!List.of("STUDENT", "TEACHER", "ADMIN").contains(normalized)) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            user.setRole(normalized);
            User saved = userRepository.save(user);
            return userMapper.toUserResponse(saved);
        } catch (java.text.ParseException e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

}

// Register a MapStruct mapper instance as a Spring bean so UserMapper can be autowired
@Configuration
class UserMapperConfig implements BeanDefinitionRegistryPostProcessor {

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
        // Remove any bean definitions that reference the generated MapStruct impl class.
        // This avoids Spring attempting to instantiate a generated class that may conflict with the devtools/restart classloader.
        for (String name : registry.getBeanDefinitionNames()) {
            BeanDefinition def = registry.getBeanDefinition(name);
            String beanClassName = def.getBeanClassName();
            if (beanClassName != null && beanClassName.contains("UserMapperImpl")) {
                registry.removeBeanDefinition(name);
            }
        }
    }

    @Override
    public void postProcessBeanFactory(org.springframework.beans.factory.config.ConfigurableListableBeanFactory beanFactory) throws BeansException {
        // no-op
    }

    @Bean
    public UserMapper userMapper() {
        // Return a MapStruct mapper instance via the factory (non-spring-backed instance).
        return org.mapstruct.factory.Mappers.getMapper(UserMapper.class);
    }
}
