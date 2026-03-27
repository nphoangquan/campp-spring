package com.example.realtimechat.dto.auth;

import jakarta.validation.constraints.NotBlank;

/** Request body cho POST /auth/logout */
public class AuthLogoutRequest {

    @NotBlank(message = "refreshToken is required")
    private String refreshToken;

    public AuthLogoutRequest() {
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
