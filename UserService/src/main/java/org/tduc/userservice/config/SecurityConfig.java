package org.tduc.userservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.util.UriComponentsBuilder;
import org.tduc.userservice.service.UserService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Configuration
// Enable JSR-250 annotations such as @PermitAll
@EnableMethodSecurity(jsr250Enabled = true)
public class SecurityConfig {
	private final OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService;
    private final UserService userService;

	@Value("${app.oauth2.success-redirect:https://localhost:8083/choose-role}")
	private String successRedirect;

	public SecurityConfig(OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService,
                         UserService userService) {
		this.customOAuth2UserService = customOAuth2UserService;
        this.userService = userService;
	}

	// ✅ Filter lấy thông tin người dùng từ header do API Gateway gắn vào
	private static class HeaderAuthenticationFilter extends OncePerRequestFilter {

		private static final String USER_ID_HEADER = "X-User-Id";
		private static final String USER_ROLE_HEADER = "X-User-Role";
		private static final String USERNAME_HEADER = "X-User-Username";

		@Override
		protected void doFilterInternal(HttpServletRequest request,
										HttpServletResponse response,
										FilterChain filterChain)
				throws ServletException, IOException {

			String userId = request.getHeader(USER_ID_HEADER);
			String username = request.getHeader(USERNAME_HEADER);
			String role = request.getHeader(USER_ROLE_HEADER);

			if (userId != null || username != null) {
				String principalName = (username != null && !username.isBlank()) ? username : userId;

				List<SimpleGrantedAuthority> authorities = new ArrayList<>();
				if (role != null && !role.isBlank()) {
					authorities.add(new SimpleGrantedAuthority(role));
				}

				Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
						principalName,
						null,
						authorities
				);

				SecurityContextHolder.getContext().setAuthentication(auth);
			}

			filterChain.doFilter(request, response);
		}
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(authorize -> authorize
						// ✅ Cho phép public các endpoint phục vụ đăng nhập / đăng ký
						.requestMatchers(
								"/api/users/auth/login",
							"/api/users/auth/admin-login",
								"/api/users/auth/register",
								"/api/users/register",
								"/api/users/choose-role",
                                "/oauth2/**",
								"/actuator/**"
						).permitAll()

						// ✅ Cho phép preflight requests (CORS OPTIONS)
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

						// ✅ Mọi request khác đều cần authenticated
						.anyRequest().authenticated()
				)
				.httpBasic(httpBasic -> httpBasic.disable())
				.formLogin(form -> form.disable())
		.oauth2Login(oauth -> oauth
			.userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
			.successHandler(successHandler())
		)
				.exceptionHandling(ex -> ex.accessDeniedHandler((request, response, accessDeniedException) -> {
						// Log and send a small message for debugging (kept minimal)
						request.getServletContext().log("Access denied for request: " + request.getRequestURI() + " - " + accessDeniedException.getMessage());
						// Additional debug: log current authentication (principal and authorities) if available
						var auth = SecurityContextHolder.getContext().getAuthentication();
						if (auth != null) {
							request.getServletContext().log("Current authentication principal: " + auth.getName() + ", authorities: " + auth.getAuthorities());
						} else {
							request.getServletContext().log("Current authentication: <none>");
						}
						response.sendError(HttpServletResponse.SC_FORBIDDEN);
					}));

		// ✅ Thêm filter header-based authentication trước UsernamePasswordAuthenticationFilter
		http.addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	public AuthenticationSuccessHandler successHandler() {
		return (request, response, authentication) -> {
			// Get email from OAuth2User
	    Object email = authentication.getPrincipal() instanceof OAuth2User
		    ? ((OAuth2User) authentication.getPrincipal()).getAttribute("email")
		    : authentication.getName();

	    String username = email != null ? email.toString() : authentication.getName();
	    String token = userService.generateToken(username);

	    // Check if user already has a role assigned
	    // If yes, redirect to frontend home; if no, redirect to choose-role
	    String redirectUrl;
	    try {
	        var user = userService.findByUsername(username);
	        String userRole = user.getRole();
	        
	        if (userRole != null && !userRole.isBlank()) {
	            // User already has role, redirect to home/dashboard with token
	            redirectUrl = UriComponentsBuilder
	                .fromUriString(successRedirect.replace("/choose-role", ""))
	                .queryParam("token", token)
	                .build()
	                .toUriString();
	        } else {
	            // User doesn't have role yet, redirect to choose-role
	            redirectUrl = UriComponentsBuilder
	                .fromUriString(successRedirect)
	                .queryParam("token", token)
	                .build()
	                .toUriString();
	        }
	    } catch (Exception e) {
	        // If error occurs, default to choose-role flow
	        redirectUrl = UriComponentsBuilder
	            .fromUriString(successRedirect)
	            .queryParam("token", token)
	            .build()
	            .toUriString();
	    }

	    response.sendRedirect(redirectUrl);
		};
	}
}
