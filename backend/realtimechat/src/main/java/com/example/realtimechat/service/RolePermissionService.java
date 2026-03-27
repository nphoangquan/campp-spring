package com.example.realtimechat.service;

import com.example.realtimechat.dto.permission.RolePermissionsResponse;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.Permission;
import com.example.realtimechat.model.RolePermissionOverride;
import com.example.realtimechat.model.ServerMember;
import com.example.realtimechat.model.ServerMemberRole;
import com.example.realtimechat.repository.RolePermissionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RolePermissionService {

    private final RolePermissionRepository rolePermissionRepository;
    private final ServerService serverService;
    private final SimpMessagingTemplate messagingTemplate;

    public RolePermissionService(RolePermissionRepository rolePermissionRepository, ServerService serverService, SimpMessagingTemplate messagingTemplate) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.serverService = serverService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Get effective permissions for all roles in a server.
     * Falls back to role defaults if no override is set.
     */
    public List<RolePermissionsResponse> getPermissionsForServer(String userId, String serverId) {
        serverService.requireMember(userId, serverId); // any member can view permissions

        // Fetch existing overrides for this server
        Map<ServerMemberRole, RolePermissionOverride> overrideMap = rolePermissionRepository
                .findByServerId(serverId)
                .stream()
                .collect(Collectors.toMap(RolePermissionOverride::getRole, o -> o));

        List<RolePermissionsResponse> result = new ArrayList<>();
        // Return all non-OWNER roles; OWNER always has everything
        for (ServerMemberRole role : new ServerMemberRole[] {
                ServerMemberRole.ADMIN, ServerMemberRole.MEMBER }) {

            RolePermissionOverride override = overrideMap.get(role);
            if (override != null) {
                List<String> perms = override.getPermissions().stream()
                        .map(Enum::name)
                        .sorted()
                        .toList();
                result.add(new RolePermissionsResponse(role.name(), perms, false));
            } else {
                List<String> perms = role.getDefaultPermissions().stream()
                        .map(Enum::name)
                        .sorted()
                        .toList();
                result.add(new RolePermissionsResponse(role.name(), perms, true));
            }
        }
        return result;
    }

    /**
     * Update permissions for a specific role in a server. OWNER only.
     */
    public RolePermissionsResponse updatePermissionsForRole(
            String userId, String serverId, ServerMemberRole targetRole, List<String> permissionNames) {

        // Allow any user with MANAGE_ROLES to update role permissions
        serverService.requirePermission(userId, serverId, Permission.MANAGE_ROLES);
        
        if (targetRole == ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot override OWNER permissions");
        }

        // Parse permissions
        Set<Permission> permissions = new HashSet<>();
        for (String name : permissionNames) {
            try {
                Permission p = Permission.valueOf(name.toUpperCase());
                if (p == Permission.MANAGE_ROLES) {
                    // Only OWNER can actually have their permissions show up, warn but allow ADMIN
                    // to have this
                }
                permissions.add(p);
            } catch (IllegalArgumentException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid permission: " + name);
            }
        }

        // Upsert override
        RolePermissionOverride override = rolePermissionRepository
                .findByServerIdAndRole(serverId, targetRole)
                .orElse(new RolePermissionOverride(serverId, targetRole, permissions));
        override.setPermissions(permissions);
        override = rolePermissionRepository.save(override);

        List<String> sorted = override.getPermissions().stream()
                .map(Enum::name).sorted().toList();

        // Broadcast event
        messagingTemplate.convertAndSend("/topic/servers/" + serverId + "/events", (Object) Map.of("type", "PERMISSIONS_UPDATED"));

        return new RolePermissionsResponse(targetRole.name(), sorted, false);
    }

    /**
     * Resolve effective permissions for a given member in a server,
     * checking for override first, then falling back to role defaults.
     */
    public Set<Permission> resolvePermissions(String serverId, ServerMemberRole role) {
        if (role == ServerMemberRole.OWNER) {
            return Set.of(Permission.values());
        }
        return rolePermissionRepository.findByServerIdAndRole(serverId, role)
                .map(RolePermissionOverride::getPermissions)
                .orElse(role.getDefaultPermissions());
    }
}
