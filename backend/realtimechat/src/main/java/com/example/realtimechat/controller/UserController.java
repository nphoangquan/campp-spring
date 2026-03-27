package com.example.realtimechat.controller;

import com.example.realtimechat.dto.user.ChangePasswordRequest;
import com.example.realtimechat.dto.user.DeleteAccountConfirmRequest;
import com.example.realtimechat.dto.user.UpdateProfileRequest;
import com.example.realtimechat.dto.user.UserResponse;
import com.example.realtimechat.model.User;
import com.example.realtimechat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal String userId,
            @RequestBody ChangePasswordRequest req) {
        userService.changePassword(userId, req);
        return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được cập nhật thành công"));
    }

    @PostMapping("/me/delete-otp")
    public ResponseEntity<?> requestDeleteAccountOtp(@AuthenticationPrincipal String userId) {
        userService.requestDeleteAccountOtp(userId);
        return ResponseEntity.ok(Map.of("message", "Mã xác nhận xóa khoản đã được gửi đến email của bạn."));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteAccount(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody DeleteAccountConfirmRequest req) {
        userService.deleteAccount(userId, req);
        return ResponseEntity.ok(Map.of("message", "Tài khoản đã được xóa thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal String userId,
            @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }

    /**
     * Upload avatar - multipart/form-data với field "file"
     * Giới hạn 5MB, chỉ chấp nhận image/*
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> uploadAvatar(
            @AuthenticationPrincipal String userId,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadAvatar(userId, file));
    }

    /**
     * Phục vụ ảnh đại diện - public endpoint không cần auth để hiển thị avatar của friend
     */
    @GetMapping("/{userId}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String userId) {
        User user = userService.getUserWithAvatar(userId);
        if (user.getAvatarData() == null || user.getAvatarData().length == 0) {
            return ResponseEntity.notFound().build();
        }
        String contentType = user.getAvatarContentType() != null ? user.getAvatarContentType() : "image/png";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, max-age=0, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(user.getAvatarData());
    }
}
