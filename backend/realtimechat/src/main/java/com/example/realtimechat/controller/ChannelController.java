package com.example.realtimechat.controller;

import com.example.realtimechat.dto.channel.*;
import com.example.realtimechat.service.ChannelService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

//API
@RestController
@RequestMapping("/servers/{serverId}/channels")
public class ChannelController {

    private final ChannelService channelService;

    public ChannelController(ChannelService channelService) {
        this.channelService = channelService;
    }

    private String userId(Authentication auth) {
        return auth.getName();
    }

    @PostMapping
    public ResponseEntity<ChannelResponse> create(Authentication auth, @PathVariable String serverId,
            @Valid @RequestBody ChannelCreateRequest req) {
        return ResponseEntity.ok(channelService.create(userId(auth), serverId, req));
    }

    @GetMapping
    public ResponseEntity<List<ChannelResponse>> list(Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(channelService.list(userId(auth), serverId));
    }

    @PatchMapping("/{channelId}")
    public ResponseEntity<ChannelResponse> update(Authentication auth, @PathVariable String serverId,
            @PathVariable String channelId,
            @Valid @RequestBody ChannelUpdateRequest req) {
        return ResponseEntity.ok(channelService.update(userId(auth), serverId, channelId, req));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<?> delete(Authentication auth, @PathVariable String serverId,
            @PathVariable String channelId) {
        channelService.delete(userId(auth), serverId, channelId);
        return ResponseEntity.ok(Map.of("message", "Channel deleted"));
    }
}