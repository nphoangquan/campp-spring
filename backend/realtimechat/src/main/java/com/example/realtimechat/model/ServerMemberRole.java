package com.example.realtimechat.model;

import java.util.Set;

//Các roll trong server
public enum ServerMemberRole {
    OWNER,
    ADMIN,
    MEMBER;

    /**
     * Default permissions for this role (used when no per-server override exists).
     */
    public Set<Permission> getDefaultPermissions() {
        switch (this) {
            case OWNER:
                return Set.of(Permission.values()); // All permissions
            case ADMIN:
                return Set.of(Permission.values()); // All permissions
            case MEMBER:
            default:
                return Set.of(
                        Permission.SEND_MESSAGE);
        }
    }
}