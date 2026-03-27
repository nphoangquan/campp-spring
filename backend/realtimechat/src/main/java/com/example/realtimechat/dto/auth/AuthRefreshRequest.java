package com.example.realtimechat.dto.auth;

import jakarta.validation.constraints.NotBlank;
//Dto nhận refresh token từ người dùng
public class AuthRefreshRequest {
    @NotBlank
    private String refreshToken;

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}