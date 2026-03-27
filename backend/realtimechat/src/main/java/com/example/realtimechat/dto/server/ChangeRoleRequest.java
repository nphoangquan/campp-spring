package com.example.realtimechat.dto.server;

import jakarta.validation.constraints.NotBlank;

public class ChangeRoleRequest {
    @NotBlank(message = "Role is required")
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
