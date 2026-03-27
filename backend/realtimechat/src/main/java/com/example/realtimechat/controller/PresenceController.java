package com.example.realtimechat.controller;

import com.example.realtimechat.dto.presence.BulkPresenceRequest;
import com.example.realtimechat.dto.presence.PresenceResponse;
import com.example.realtimechat.dto.presence.UpdateActivityRequest;
import com.example.realtimechat.service.PresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    /** Lấy presence của 1 user */
    @GetMapping("/{userId}")
    public ResponseEntity<PresenceResponse> getPresence(@PathVariable String userId) {
        return ResponseEntity.ok(presenceService.getPresence(userId));
    }

    /** Lấy presence nhiều user cùng lúc */
    @PostMapping("/bulk")
    public ResponseEntity<List<PresenceResponse>> getBulkPresence(
            @RequestBody BulkPresenceRequest req) {
        return ResponseEntity.ok(presenceService.getPresenceBulk(req.getUserIds()));
    }

    /** Cập nhật activity message cá nhân */
    @PutMapping("/activity")
    public ResponseEntity<Void> updateActivity(
            @AuthenticationPrincipal String userId,
            @RequestBody UpdateActivityRequest req) {
        presenceService.updateActivityMessage(userId, req.getActivityMessage());
        return ResponseEntity.ok().build();
    }

    /** Cập nhật status cá nhân (ONLINE, IDLE, DND, v.v...) hoặc cho phép huỷ override (null) bằng DEFAULT */
    @PutMapping("/status")
    public ResponseEntity<Void> updateStatus(
            @AuthenticationPrincipal String userId,
            @RequestBody com.example.realtimechat.dto.presence.UpdateStatusRequest req) {
        presenceService.updateManualStatus(userId, req.getStatus());
        return ResponseEntity.ok().build();
    }
}
