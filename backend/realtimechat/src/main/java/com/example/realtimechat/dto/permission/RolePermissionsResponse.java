package com.example.realtimechat.dto.permission;

import java.util.List;

public class RolePermissionsResponse {
    private String role;
    private List<String> permissions;
    private boolean isDefault; // true if no custom override set for this server

    public RolePermissionsResponse() {
    }

    public RolePermissionsResponse(String role, List<String> permissions, boolean isDefault) {
        this.role = role;
        this.permissions = permissions;
        this.isDefault = isDefault;
    }

    public String getRole() {
        return role;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }

    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }
}
