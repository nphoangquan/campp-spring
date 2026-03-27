package com.example.realtimechat.security;

import com.example.realtimechat.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
//Kiểm tra JWT trong mỗi request trước khi vào controller
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = auth.substring("Bearer ".length()).trim();
        try {
            Jws<Claims> jws = jwtService.parse(token);

            // Không cho refresh token đi qua như access token
            if (jwtService.isRefreshToken(jws)) {
                filterChain.doFilter(request, response);
                return;
            }

            String userId = jws.getBody().getSubject();
            if (userId == null || SecurityContextHolder.getContext().getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Optional: check user exists
            userRepository.findById(userId).ifPresent(user -> {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) jws.getBody().get("roles");

                var authorities = (roles == null ? List.<String>of() : roles)
                        .stream()
                        .filter(Objects::nonNull)
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .collect(Collectors.toList());

                var authToken = new UsernamePasswordAuthenticationToken(
                        userId, null, authorities
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            });

            filterChain.doFilter(request, response);
        } catch (JwtException ex) {
            // Token invalid -> không set auth, cho đi tiếp để Security chặn
            filterChain.doFilter(request, response);
        }
    }
}
