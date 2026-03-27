package com.example.realtimechat.dto.permission;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class UpdateRolePermissionsRequest {
    @NotNull(message = "permissions list is required")
    private List<String> permissions;

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
}
