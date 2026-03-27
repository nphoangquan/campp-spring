package com.example.realtimechat.security;

import com.example.realtimechat.model.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

//Tạo và validate JWT access token và refresh token
@Service
public class JwtService {

    private final Key key;
    private final int accessTokenMinutes;
    private final int refreshTokenDays;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.accessTokenMinutes}") int accessTokenMinutes,
            @Value("${app.jwt.refreshTokenDays}") int refreshTokenDays
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenDays = refreshTokenDays;
    }

    public String generateAccessToken(String userId, String email, Set<UserRole> roles) {
        Instant now = Instant.now();
        Instant exp = now.plus(accessTokenMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .claim("email", email)
                .claim("roles", roles.stream().map(Enum::name).collect(Collectors.toList()))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        Instant now = Instant.now();
        Instant exp = now.plus(refreshTokenDays, ChronoUnit.DAYS);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .claim("type", "refresh")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) throws JwtException {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }

    public boolean isRefreshToken(Jws<Claims> jws) {
        Object type = jws.getBody().get("type");
        return type != null && "refresh".equals(type.toString());
    }

    // ============================
    // Added helpers (PHASE 3 WS)
    // ============================

    /**
     * Lấy "username" dùng cho security (ở dự án này chính là email) từ access token.
     * Access token của bạn có claim "email".
     */
    public String extractUsername(String token) throws JwtException {
        Jws<Claims> jws = parse(token);

        // Không cho refresh token đi vào flow xác thực user
        if (isRefreshToken(jws)) return null;

        Object email = jws.getBody().get("email");
        if (email == null) return null;

        String s = email.toString().trim();
        return s.isEmpty() ? null : s;
    }

    /**
     * Alias để tránh sai khác naming (extractUserName vs extractUsername).
     * Nếu interceptor đang gọi extractUserName(...) thì vẫn chạy.
     */
    public String extractUserName(String token) throws JwtException {
        return extractUsername(token);
    }

    /**
     * Token hợp lệ nếu:
     * - parse được (chữ ký đúng, chưa hết hạn)
     * - và KHÔNG phải refresh token
     */
    public boolean isTokenValid(String token) {
        try {
            Jws<Claims> jws = parse(token);
            return !isRefreshToken(jws);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Alias theo naming bạn nói đang bị thiếu: isTokenInvalid(...)
     */
    public boolean isTokenInvalid(String token) {
        return !isTokenValid(token);
    }
}