package com.example.realtimechat.controller;

import com.example.realtimechat.dto.dm.DmPageResponse;
import com.example.realtimechat.service.DirectMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dm")
public class DirectMessageController {

    private final DirectMessageService dmService;

    public DirectMessageController(DirectMessageService dmService) {
        this.dmService = dmService;
    }

    /**
     * Lấy lịch sử DM với một user khác.
     * GET /api/dm/{otherId}/history?page=0&size=30
     *
     * BUG FIX: JwtAuthFilter set principal = userId (không phải email).
     * Dùng SecurityContextHolder.getAuthentication().getName() để lấy userId.
     */
    @GetMapping("/{otherId}/history")
    public ResponseEntity<DmPageResponse> getHistory(
            @PathVariable String otherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {

        String currentUserId = currentUserId();
        DmPageResponse resp = dmService.getHistory(currentUserId, otherId, page, size);
        return ResponseEntity.ok(resp);
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Not authenticated");
        }
        return auth.getName(); // = userId (set bởi JwtAuthFilter)
    }

    @PostMapping("/{messageId}/react")
    public ResponseEntity<com.example.realtimechat.dto.dm.DmResponse> reactToMessage(
            @PathVariable String messageId,
            @RequestParam String emoji,
            @RequestParam boolean isAdding) {
        return ResponseEntity.ok(dmService.reactMessage(messageId, currentUserId(), emoji, isAdding));
    }

    @PutMapping("/{messageId}/pin")
    public ResponseEntity<com.example.realtimechat.dto.dm.DmResponse> pinMessage(
            @PathVariable String messageId,
            @RequestParam boolean pin) {
        return ResponseEntity.ok(dmService.pinMessage(messageId, currentUserId(), pin));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<com.example.realtimechat.dto.dm.DmResponse> deleteMessage(
            @PathVariable String messageId) {
        return ResponseEntity.ok(dmService.deleteMessage(messageId, currentUserId()));
    }

    @GetMapping("/{otherId}/block-status")
    public ResponseEntity<com.example.realtimechat.dto.dm.BlockStatusDto> getBlockStatus(
            @PathVariable String otherId) {
        return ResponseEntity.ok(dmService.getBlockStatus(currentUserId(), otherId));
    }

    @PostMapping("/{otherId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable String otherId) {
        dmService.blockUser(currentUserId(), otherId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{otherId}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable String otherId) {
        dmService.unblockUser(currentUserId(), otherId);
        return ResponseEntity.ok().build();
    }
}
