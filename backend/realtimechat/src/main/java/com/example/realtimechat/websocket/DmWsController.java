package com.example.realtimechat.websocket;

import com.example.realtimechat.dto.dm.DmResponse;
import com.example.realtimechat.dto.dm.DmSendRequest;
import com.example.realtimechat.service.DirectMessageService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket controller cho Direct Message.
 *
 * Client SEND tới:
 * /app/dm/{receiverId}/send
 *
 * Server FORWARD tới (private queues):
 * /user/{receiverId}/queue/dm — receiver nhận
 * /user/{senderId}/queue/dm — sender nhận (sync nhiều tab)
 *
 * ✅ FIX: StompAuthChannelInterceptor giờ set principal.getName() = userId
 * (không phải email).
 * convertAndSendToUser(userId, ...) khớp với client subscribe
 * /user/{userId}/queue/dm.
 */
@Controller
public class DmWsController {

    private final DirectMessageService dmService;
    private final SimpMessagingTemplate messagingTemplate;

    public DmWsController(DirectMessageService dmService,
            SimpMessagingTemplate messagingTemplate) {
        this.dmService = dmService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/dm/{receiverId}/send")
    public void sendDm(
            @DestinationVariable String receiverId,
            @Valid @Payload DmSendRequest payload,
            Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }

        // principal.getName() = userId (set bởi StompAuthChannelInterceptor sau khi
        // fix)
        String senderId = principal.getName();

        try {
            DmResponse saved = dmService.sendDm(senderId, receiverId, payload.getContent(), payload.getReplyToMessageId());

            // Forward tới receiver (private user-destination)
            messagingTemplate.convertAndSendToUser(receiverId, "/queue/dm", saved);

            // Forward tới sender (sync multiple tabs)
            messagingTemplate.convertAndSendToUser(senderId, "/queue/dm", saved);
        } catch (Exception e) {
            // Gửi lỗi về cho sender qua queue riêng
            java.util.Map<String, String> errorPayload = new java.util.HashMap<>();
            errorPayload.put("error", e.getMessage());
            messagingTemplate.convertAndSendToUser(senderId, "/queue/dm-error", errorPayload);
        }
    }
}
