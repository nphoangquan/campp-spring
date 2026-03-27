package com.example.realtimechat.service;

import com.example.realtimechat.dto.auth.AuthLoginRequest;
import com.example.realtimechat.dto.auth.AuthRefreshRequest;
import com.example.realtimechat.dto.auth.AuthRegisterRequest;
import com.example.realtimechat.dto.auth.AuthResponse;
import com.example.realtimechat.dto.auth.AuthVerifyRequest;
import com.example.realtimechat.dto.auth.AuthForgotPasswordRequest;
import com.example.realtimechat.dto.auth.AuthResetPasswordRequest;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.TokenBlacklist;
import com.example.realtimechat.model.User;
import com.example.realtimechat.model.UserRole;
import com.example.realtimechat.repository.TokenBlacklistRepository;
import com.example.realtimechat.repository.UserRepository;
import com.example.realtimechat.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Random;
import java.util.Set;
import java.util.Set;

// Xử lý logic đăng ký, login, refresh token, logout
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistRepository blacklistRepository;
    private final JavaMailSender mailSender;

    public AuthService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenBlacklistRepository blacklistRepository,
            JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.blacklistRepository = blacklistRepository;
        this.mailSender = mailSender;
    }

    public void register(AuthRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
        }

        String hash = passwordEncoder.encode(req.getPassword());
        User user = new User(req.getUsername(), req.getEmail(), hash, Set.of(UserRole.MEMBER));
        
        // Setup confirmation code
        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
        user.setVerified(false);
        userRepository.save(user);

        // Send email
        sendVerificationEmail(user.getEmail(), verificationCode);
    }

    public void verifyAccount(AuthVerifyRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isVerified()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Account is already verified");
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(req.getCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }

        if (user.getVerificationCodeExpiry() != null && Instant.now().isAfter(user.getVerificationCodeExpiry())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired");
        }

        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
    }

    public void forgotPassword(AuthForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
        userRepository.save(user);

        sendPasswordResetEmail(user.getEmail(), verificationCode);
    }

    public void resetPassword(AuthResetPasswordRequest req) {
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(req.getCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }

        if (user.getVerificationCodeExpiry() != null && Instant.now().isAfter(user.getVerificationCodeExpiry())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired");
        }

        String hash = passwordEncoder.encode(req.getNewPassword());
        user.setPasswordHash(hash);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
    }

    public AuthResponse login(AuthLoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!user.isVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account not verified. Please verify your account first.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String access = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        String refresh = jwtService.generateRefreshToken(user.getId());
        return new AuthResponse(access, refresh);
    }

    public AuthResponse refresh(AuthRefreshRequest req) {
        try {
            Jws<Claims> jws = jwtService.parse(req.getRefreshToken());
            if (!jwtService.isRefreshToken(jws)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
            }

            // Kiểm tra token có bị blacklist (đã logout) không
            String tokenHash = hashToken(req.getRefreshToken());
            if (blacklistRepository.existsByTokenHash(tokenHash)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token has been revoked");
            }

            String userId = jws.getBody().getSubject();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

            String access = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
            String refresh = jwtService.generateRefreshToken(user.getId()); // rotate refresh
            return new AuthResponse(access, refresh);
        } catch (JwtException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }

    /**
     * Logout: thu hồi refresh token bằng cách blacklist nó.
     * Access token không bị thu hồi (short-lived – trade-off chuẩn của stateless
     * JWT).
     */
    public void logout(String refreshToken) {
        try {
            Jws<Claims> jws = jwtService.parse(refreshToken);
            if (!jwtService.isRefreshToken(jws)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Provided token is not a refresh token");
            }

            // Hash trước khi lưu – không lưu raw token
            String tokenHash = hashToken(refreshToken);

            // Idempotent: nếu đã blacklist rồi thì bỏ qua
            if (blacklistRepository.existsByTokenHash(tokenHash)) {
                return;
            }

            // Lấy thời điểm hết hạn từ token để TTL index tự xóa document
            Instant expiresAt = jws.getBody().getExpiration().toInstant();
            blacklistRepository.save(new TokenBlacklist(tokenHash, expiresAt));

        } catch (JwtException ex) {
            // Token đã hết hạn hoặc invalid → coi như đã logout
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }
    }

    /** SHA-256 hash của token string */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encoded);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 luôn có mặt trong JDK – không bao giờ xảy ra
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendVerificationEmail(String to, String code) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("Mã xác thực tài khoản - Realtime Chat");
            msg.setText("Trân trọng chào bạn,\n\nMã xác thực 6 số của bạn là: " + code + "\n\nMã có hiệu lực trong 15 phút.");
            msg.setFrom("no-reply@realtimechat.com");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("GHI CHÚ (DEV MODE): Không gửi được mail tới " + to + ". Mã xác thực của bạn là: " + code);
        }
    }

    private void sendPasswordResetEmail(String to, String code) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("Yêu cầu đặt lại mật khẩu - Realtime Chat");
            msg.setText("Trân trọng chào bạn,\n\nMã xác thực để đặt lại mật khẩu của bạn là: " + code + "\n\nMã có hiệu lực trong 15 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");
            msg.setFrom("no-reply@realtimechat.com");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("GHI CHÚ (DEV MODE): Không gửi được mail tới " + to + ". Mã khôi phục mật khẩu của bạn là: " + code);
        }
    }
}