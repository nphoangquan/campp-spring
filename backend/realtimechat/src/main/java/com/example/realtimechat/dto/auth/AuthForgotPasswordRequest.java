package com.example.realtimechat.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthForgotPasswordRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;

    public AuthForgotPasswordRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
