package com.example.realtimechat.controller;

import com.example.realtimechat.dto.server.*;
import com.example.realtimechat.service.ServerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.example.realtimechat.model.ServerMemberRole;

//API server
@RestController
@RequestMapping("/servers")
public class ServerController {

    private final ServerService serverService;

    public ServerController(ServerService serverService) {
        this.serverService = serverService;
    }

    private String userId(Authentication auth) {
        return auth.getName(); // Phase 1 JwtAuthFilter set principal = userId
    }

    @PostMapping
    public ResponseEntity<ServerResponse> create(Authentication auth, @Valid @RequestBody ServerCreateRequest req) {
        return ResponseEntity.ok(serverService.createServer(userId(auth), req));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ServerListItemResponse>> myServers(Authentication auth) {
        return ResponseEntity.ok(serverService.myServers(userId(auth)));
    }

    @GetMapping("/{serverId}")
    public ResponseEntity<ServerResponse> get(Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(serverService.getServer(userId(auth), serverId));
    }

    @PatchMapping("/{serverId}")
    public ResponseEntity<ServerResponse> update(Authentication auth, @PathVariable String serverId,
            @Valid @RequestBody ServerUpdateRequest req) {
        return ResponseEntity.ok(serverService.updateServer(userId(auth), serverId, req));
    }

    @DeleteMapping("/{serverId}")
    public ResponseEntity<?> delete(Authentication auth, @PathVariable String serverId) {
        serverService.deleteServer(userId(auth), serverId);
        return ResponseEntity.ok(Map.of("message", "Server deleted"));
    }

    @PostMapping("/{serverId}/join")
    public ResponseEntity<JoinLeaveResponse> join(Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(serverService.joinByServerId(userId(auth), serverId));
    }

    @PostMapping("/join-by-invite")
    public ResponseEntity<JoinLeaveResponse> joinByInvite(Authentication auth, @RequestBody Map<String, String> body) {
        String inviteCode = body.get("inviteCode");
        if (inviteCode == null || inviteCode.isBlank()) {
            return ResponseEntity.badRequest().body(new JoinLeaveResponse("inviteCode is required"));
        }
        return ResponseEntity.ok(serverService.joinByInviteCode(userId(auth), inviteCode));
    }

    @PostMapping("/{serverId}/leave")
    public ResponseEntity<JoinLeaveResponse> leave(Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(serverService.leaveServer(userId(auth), serverId));
    }

    @GetMapping("/{serverId}/members")
    public ResponseEntity<List<ServerMemberResponse>> getMembers(Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(serverService.getServerMembers(userId(auth), serverId));
    }

    @PutMapping("/{serverId}/members/{targetUserId}/role")
    public ResponseEntity<?> updateMemberRole(Authentication auth, @PathVariable String serverId,
            @PathVariable String targetUserId, @Valid @RequestBody ChangeRoleRequest req) {
        ServerMemberRole role;
        try {
            role = ServerMemberRole.valueOf(req.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }

        serverService.updateMemberRole(userId(auth), serverId, targetUserId, role);
        return ResponseEntity.ok(Map.of("message", "Role updated"));
    }

    @DeleteMapping("/{serverId}/members/{targetUserId}")
    public ResponseEntity<?> kickMember(Authentication auth, @PathVariable String serverId,
            @PathVariable String targetUserId) {
        serverService.kickMember(userId(auth), serverId, targetUserId);
        return ResponseEntity.ok(Map.of("message", "Member kicked"));
    }
}