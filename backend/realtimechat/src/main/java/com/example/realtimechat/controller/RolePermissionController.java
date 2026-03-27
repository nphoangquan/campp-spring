package com.example.realtimechat.controller;

import com.example.realtimechat.dto.permission.RolePermissionsResponse;
import com.example.realtimechat.dto.permission.UpdateRolePermissionsRequest;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.ServerMemberRole;
import com.example.realtimechat.service.RolePermissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/servers/{serverId}/role-permissions")
public class RolePermissionController {

    private final RolePermissionService rolePermissionService;

    public RolePermissionController(RolePermissionService rolePermissionService) {
        this.rolePermissionService = rolePermissionService;
    }

    private String userId(Authentication auth) {
        return auth.getName();
    }

    /**
     * GET /servers/{serverId}/role-permissions
     * Returns effective permissions for all roles in the server.
     */
    @GetMapping
    public ResponseEntity<List<RolePermissionsResponse>> getPermissions(
            Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(rolePermissionService.getPermissionsForServer(userId(auth), serverId));
    }

    /**
     * PUT /servers/{serverId}/role-permissions/{role}
     * Update permissions for a specific role. OWNER only.
     */
    @PutMapping("/{role}")
    public ResponseEntity<?> updatePermissions(
            Authentication auth,
            @PathVariable String serverId,
            @PathVariable String role,
            @Valid @RequestBody UpdateRolePermissionsRequest req) {

        ServerMemberRole targetRole;
        try {
            targetRole = ServerMemberRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role: " + role);
        }

        return ResponseEntity.ok(
                rolePermissionService.updatePermissionsForRole(userId(auth), serverId, targetRole,
                        req.getPermissions()));
    }
}
