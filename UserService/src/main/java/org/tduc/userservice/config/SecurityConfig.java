package org.tduc.userservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

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
								"/api/users/auth/register",
								"/api/users/register",
								"/actuator/**"
						).permitAll()

						// ✅ Cho phép preflight requests (CORS OPTIONS)
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

						// ✅ Mọi request khác đều cần authenticated
						.anyRequest().authenticated()
				)
				.httpBasic(httpBasic -> httpBasic.disable())
				.formLogin(form -> form.disable())
				.exceptionHandling(ex -> ex.accessDeniedHandler((request, response, accessDeniedException) -> {
						// Log and send a small message for debugging (kept minimal)
						request.getServletContext().log("Access denied for request: " + request.getRequestURI() + " - " + accessDeniedException.getMessage());
						response.sendError(HttpServletResponse.SC_FORBIDDEN);
					}));

		// ✅ Thêm filter header-based authentication trước UsernamePasswordAuthenticationFilter
		http.addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
