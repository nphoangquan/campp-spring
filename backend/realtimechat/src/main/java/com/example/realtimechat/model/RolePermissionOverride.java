package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

/**
 * Stores custom permission overrides per role per server.
 * OWNER permissions are always full and cannot be overridden.
 */
@Document(collection = "role_permission_overrides")
@CompoundIndex(name = "idx_server_role", def = "{'serverId': 1, 'role': 1}", unique = true)
public class RolePermissionOverride {

    @Id
    private String id;

    private String serverId;

    private ServerMemberRole role;

    private Set<Permission> permissions;

    public RolePermissionOverride() {
    }

    public RolePermissionOverride(String serverId, ServerMemberRole role, Set<Permission> permissions) {
        this.serverId = serverId;
        this.role = role;
        this.permissions = permissions;
    }

    public String getId() {
        return id;
    }

    public String getServerId() {
        return serverId;
    }

    public ServerMemberRole getRole() {
        return role;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public void setRole(ServerMemberRole role) {
        this.role = role;
    }

    public void setPermissions(Set<Permission> permissions) {
        this.permissions = permissions;
    }
}
