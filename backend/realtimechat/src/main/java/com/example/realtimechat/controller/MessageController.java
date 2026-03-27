package com.example.realtimechat.controller;

import com.example.realtimechat.dto.message.MessagePageResponse;
import com.example.realtimechat.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    /**
     * GET /api/messages/channel/{channelId}?page=0&size=20
     */
    @GetMapping("/channel/{channelId}")
    public ResponseEntity<MessagePageResponse> getChannelHistory(
            @PathVariable String channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(messageService.getChannelHistory(channelId, page, size));
    }

    @PostMapping("/{messageId}/react")
    public ResponseEntity<com.example.realtimechat.dto.message.MessageResponse> reactToMessage(
            @PathVariable String messageId,
            @RequestParam String emoji,
            @RequestParam boolean isAdding) {
        return ResponseEntity.ok(messageService.reactMessage(messageId, currentUserId(), emoji, isAdding));
    }

    @PutMapping("/{messageId}/pin")
    public ResponseEntity<com.example.realtimechat.dto.message.MessageResponse> pinMessage(
            @PathVariable String messageId,
            @RequestParam boolean pin) {
        return ResponseEntity.ok(messageService.pinMessage(messageId, currentUserId(), pin));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<com.example.realtimechat.dto.message.MessageResponse> deleteMessage(
            @PathVariable String messageId) {
        return ResponseEntity.ok(messageService.deleteMessage(messageId, currentUserId()));
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Not authenticated");
        }
        return auth.getName();
    }
}