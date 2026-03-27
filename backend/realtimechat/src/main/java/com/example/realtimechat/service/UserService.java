package com.example.realtimechat.service;

import com.example.realtimechat.dto.user.ChangePasswordRequest;
import com.example.realtimechat.dto.user.DeleteAccountConfirmRequest;
import com.example.realtimechat.dto.user.UpdateProfileRequest;
import com.example.realtimechat.dto.user.UserResponse;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.User;
import com.example.realtimechat.repository.UserPresenceRepository;
import com.example.realtimechat.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
public class UserService {

    private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

    private final UserRepository userRepository;
    private final UserPresenceRepository presenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    public UserService(UserRepository userRepository,
                       UserPresenceRepository presenceRepository,
                       PasswordEncoder passwordEncoder,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.presenceRepository = presenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    public void changePassword(String userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public void requestDeleteAccountOtp(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
        userRepository.save(user);

        sendDeleteAccountEmail(user.getEmail(), verificationCode);
    }

    public void deleteAccount(String userId, DeleteAccountConfirmRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(req.getCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }

        if (user.getVerificationCodeExpiry() != null && Instant.now().isAfter(user.getVerificationCodeExpiry())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired");
        }

        userRepository.delete(user);
        presenceRepository.deleteByUserId(userId);
    }

    public UserResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return toResponse(user);
    }

    public UserResponse updateProfile(String userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (req.getUsername() != null && !req.getUsername().trim().isEmpty()
                && !req.getUsername().equals(user.getUsername())) {
            userRepository.findByUsername(req.getUsername()).ifPresent(u -> {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Username already exists");
            });
            user.setUsername(req.getUsername().trim());
        }

        userRepository.save(user);
        return toResponse(user);
    }

    public UserResponse uploadAvatar(String userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File không được để trống");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ảnh phải nhỏ hơn 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận file ảnh");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        try {
            user.setAvatarData(file.getBytes());
            user.setAvatarContentType(contentType);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đọc file ảnh");
        }

        userRepository.save(user);
        return toResponse(user);
    }

    public User getUserWithAvatar(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                user.getAvatarData() != null && user.getAvatarData().length > 0);
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendDeleteAccountEmail(String to, String code) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("Mã xác nhận xóa tài khoản - Realtime Chat");
            msg.setText("Trân trọng chào bạn,\n\nMã xác nhận để xóa tài khoản của bạn là: " + code + "\n\nMã có hiệu lực trong 15 phút. Nếu bạn không yêu cầu xóa tài khoản, vui lòng bỏ qua email này.");
            msg.setFrom("no-reply@realtimechat.com");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("GHI CHÚ (DEV MODE): Không gửi được mail tới " + to + ". Mã xóa tài khoản của bạn là: " + code);
        }
    }
}
