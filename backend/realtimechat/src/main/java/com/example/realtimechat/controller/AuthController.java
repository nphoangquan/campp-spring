package com.example.realtimechat.controller;

import com.example.realtimechat.dto.auth.AuthLoginRequest;
import com.example.realtimechat.dto.auth.AuthLogoutRequest;
import com.example.realtimechat.dto.auth.AuthRefreshRequest;
import com.example.realtimechat.dto.auth.AuthRegisterRequest;
import com.example.realtimechat.dto.auth.AuthResponse;
import com.example.realtimechat.dto.auth.AuthVerifyRequest;
import com.example.realtimechat.dto.auth.AuthForgotPasswordRequest;
import com.example.realtimechat.dto.auth.AuthResetPasswordRequest;
import com.example.realtimechat.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// REST API xác thực: register, login, refresh, logout
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok().body(Map.of("message", "Registered successfully. Please check your email for the verification code."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody AuthVerifyRequest req) {
        authService.verifyAccount(req);
        return ResponseEntity.ok(Map.of("message", "Account verified successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthLoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody AuthForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(Map.of("message", "Password reset code sent. Please check your email."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody AuthResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody AuthRefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    /**
     * Logout: thu hồi refresh token.
     * Client phải xóa cả access token và refresh token khỏi bộ nhớ sau khi gọi
     * endpoint này.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody AuthLogoutRequest req) {
        authService.logout(req.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}