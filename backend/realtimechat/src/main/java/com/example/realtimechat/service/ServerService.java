package com.example.realtimechat.service;

import com.example.realtimechat.dto.server.*;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.Permission;
import com.example.realtimechat.model.Server;
import com.example.realtimechat.model.ServerMember;
import com.example.realtimechat.model.ServerMemberRole;
import com.example.realtimechat.repository.CategoryRepository;
import com.example.realtimechat.repository.ChannelRepository;
import com.example.realtimechat.repository.RolePermissionRepository;
import com.example.realtimechat.repository.ServerMemberRepository;
import com.example.realtimechat.repository.ServerRepository;
import com.example.realtimechat.repository.UserRepository;
import com.example.realtimechat.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

//Xử lý logic server
@Service
public class ServerService {

    private final ServerRepository serverRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final CategoryRepository categoryRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final SecureRandom RANDOM = new SecureRandom();

    public ServerService(
            ServerRepository serverRepository,
            ServerMemberRepository serverMemberRepository,
            CategoryRepository categoryRepository,
            ChannelRepository channelRepository,
            UserRepository userRepository,
            RolePermissionRepository rolePermissionRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.serverRepository = serverRepository;
        this.serverMemberRepository = serverMemberRepository;
        this.categoryRepository = categoryRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public ServerResponse createServer(String userId, ServerCreateRequest req) {
        String inviteCode = generateInviteCode();
        Server server = new Server(userId, req.getName(), inviteCode);
        server = serverRepository.save(server);

        // owner becomes member with role OWNER
        serverMemberRepository.save(new ServerMember(server.getId(), userId, ServerMemberRole.OWNER));

        return toResponse(server);
    }

    public List<ServerListItemResponse> myServers(String userId) {
        List<ServerMember> memberships = serverMemberRepository.findByUserId(userId);
        if (memberships.isEmpty())
            return List.of();

        // Batch fetch toàn bộ servers trong 1 query duy nhất – tránh N+1
        List<String> serverIds = memberships.stream()
                .map(ServerMember::getServerId)
                .toList();
        Map<String, Server> serverMap = serverRepository.findByIdIn(serverIds)
                .stream()
                .collect(Collectors.toMap(Server::getId, s -> s));

        return memberships.stream()
                .filter(m -> serverMap.containsKey(m.getServerId()))
                .map(m -> {
                    Server s = serverMap.get(m.getServerId());
                    return new ServerListItemResponse(s.getId(), s.getName(), m.getRole().name());
                })
                .toList();
    }

    public ServerResponse getServer(String userId, String serverId) {
        requireMember(userId, serverId);
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Server not found"));
        return toResponse(server);
    }

    public ServerResponse updateServer(String userId, String serverId, ServerUpdateRequest req) {
        requireOwner(userId, serverId);
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Server not found"));

        server.setName(req.getName());
        server.setUpdatedAt(Instant.now());

        server = serverRepository.save(server);
        return toResponse(server);
    }

    public void deleteServer(String userId, String serverId) {
        requireOwner(userId, serverId);

        // delete dependents
        channelRepository.deleteByServerId(serverId);
        categoryRepository.deleteByServerId(serverId);
        serverMemberRepository.deleteByServerId(serverId);
        rolePermissionRepository.deleteByServerId(serverId);
        serverRepository.deleteById(serverId);
    }

    public JoinLeaveResponse joinByServerId(String userId, String serverId) {
        serverRepository.findById(serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Server not found"));

        boolean exists = serverMemberRepository.findByServerIdAndUserId(serverId, userId).isPresent();
        if (exists)
            return new JoinLeaveResponse("Already joined");

        serverMemberRepository.save(new ServerMember(serverId, userId, ServerMemberRole.MEMBER));
        return new JoinLeaveResponse("Joined server");
    }

    public JoinLeaveResponse joinByInviteCode(String userId, String inviteCode) {
        Server server = serverRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invalid invite code"));

        return joinByServerId(userId, server.getId());
    }

    public JoinLeaveResponse leaveServer(String userId, String serverId) {
        ServerMember member = requireMember(userId, serverId);
        if (member.getRole() == ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Owner cannot leave. Delete server or transfer ownership.");
        }

        serverMemberRepository.deleteByServerIdAndUserId(serverId, userId);
        return new JoinLeaveResponse("Left server");
    }

    public ServerMember requireMember(String userId, String serverId) {
        return serverMemberRepository.findByServerIdAndUserId(serverId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Not a member of this server"));
    }

    public void requireOwner(String userId, String serverId) {
        ServerMember m = requireMember(userId, serverId);
        if (m.getRole() != ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can perform this action");
        }
    }

    /**
     * Resolves the effective permissions for a user in a server,
     * checking override first then falling back to role defaults.
     * Throws 403 if user does not have the required permission.
     */
    public void requirePermission(String userId, String serverId, Permission required) {
        ServerMember member = requireMember(userId, serverId);
        ServerMemberRole role = member.getRole();

        // OWNER always has all permissions
        if (role == ServerMemberRole.OWNER)
            return;

        // Look up override, fall back to role defaults
        Set<Permission> effective = rolePermissionRepository
                .findByServerIdAndRole(serverId, role)
                .map(override -> override.getPermissions())
                .orElse(role.getDefaultPermissions());

        if (!effective.contains(required)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Missing permission: " + required.name());
        }
    }

    public List<ServerMemberResponse> getServerMembers(String userId, String serverId) {
        // verify calling user is in server
        requireMember(userId, serverId);

        List<ServerMember> memberships = serverMemberRepository.findByServerId(serverId);
        List<String> userIds = memberships.stream().map(ServerMember::getUserId).toList();
        Map<String, User> userMap = userRepository.findByIdIn(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return memberships.stream()
                .map(m -> {
                    User u = userMap.get(m.getUserId());
                    String username = u != null ? u.getUsername() : "Unknown User";
                    return new ServerMemberResponse(m.getUserId(), username, m.getRole().name(), m.getJoinedAt());
                })
                .toList();
    }

    public void updateMemberRole(String executorId, String serverId, String targetUserId, ServerMemberRole newRole) {
        ServerMember executor = requireMember(executorId, serverId);
        ServerMember target = serverMemberRepository.findByServerIdAndUserId(serverId, targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target member not found"));

        // Check MANAGE_ROLES permission using dynamic resolution
        requirePermission(executorId, serverId, Permission.MANAGE_ROLES);

        if (target.getRole() == ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot change OWNER role");
        }

        // Cannot promote to OWNER via this endpoint
        if (newRole == ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot promote to OWNER via this endpoint");
        }

        // Only OWNER can modify ADMIN
        if (target.getRole() == ServerMemberRole.ADMIN && executor.getRole() != ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can modify ADMIN");
        }

        // ADMIN cannot promote another member to ADMIN (only OWNER can)
        if (newRole == ServerMemberRole.ADMIN && executor.getRole() != ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can assign ADMIN role");
        }

        target.setRole(newRole);
        serverMemberRepository.save(target);

        // Broadcast event
        messagingTemplate.convertAndSend("/topic/servers/" + serverId + "/events", (Object) Map.of("type", "ROLE_UPDATED"));
    }

    public void kickMember(String executorId, String serverId, String targetUserId) {
        if (executorId.equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot kick yourself. Use leave instead.");
        }

        ServerMember executor = requireMember(executorId, serverId);
        ServerMember target = serverMemberRepository.findByServerIdAndUserId(serverId, targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target member not found"));

        // Check KICK_MEMBER permission using dynamic resolution
        requirePermission(executorId, serverId, Permission.KICK_MEMBER);

        if (target.getRole() == ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot kick OWNER");
        }

        // Only OWNER can kick ADMIN
        if (target.getRole() == ServerMemberRole.ADMIN && executor.getRole() != ServerMemberRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can kick ADMIN");
        }

        // ADMIN cannot kick ADMIN
        if (target.getRole() == ServerMemberRole.ADMIN && executor.getRole() == ServerMemberRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN cannot kick another ADMIN");
        }

        serverMemberRepository.delete(target);
    }

    private ServerResponse toResponse(Server s) {
        return new ServerResponse(
                s.getId(),
                s.getOwnerId(),
                s.getName(),
                s.getInviteCode(),
                s.getCreatedAt(),
                s.getUpdatedAt());
    }

    private String generateInviteCode() {
        byte[] bytes = new byte[8];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}