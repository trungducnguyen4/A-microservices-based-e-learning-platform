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
@Service
public class UserService {
    @Autowired
            
    UserRepository userRepository;
    @Autowired
    UserMapper userMapper;
    protected static final String SINGERKEY = "mysupersecretrandomstringwith32chars!";

    public AuthResponse authenticate(AuthRequest authRequest) {
        var user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USERNAME_NOT_EXIST));

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        boolean passmatch = passwordEncoder.matches(authRequest.getPassword(), user.getPassword());

        if (!passmatch) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var token = generateToken(user.getUsername());
        return AuthResponse.builder().token(token).authenticated(true).build();
    }
    //    }
    private String generateToken(String username) {
        try {
            byte[] secret = SINGERKEY.getBytes(StandardCharsets.UTF_8);
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USERNAME_NOT_EXIST));

            JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                    .subject(username)
                    .issuer("duc nguyen")
                    .expirationTime(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                    .claim("cc", "do mixi")
                    .claim("role", user.getRole()) // Add role to payload
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
            JWSVerifier verifier = new MACVerifier(SINGERKEY.getBytes(StandardCharsets.UTF_8));
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
    //
    public User createRequest(@Valid UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }


        User user = userMapper.toUser(request);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse editUser(Long userId, @Valid UserEditRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userMapper.updateUser(user, request);
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    public void deleteUser(Long id) {
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

}
