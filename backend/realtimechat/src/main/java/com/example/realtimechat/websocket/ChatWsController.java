package com.example.realtimechat.websocket;

import com.example.realtimechat.dto.message.MessageResponse;
import com.example.realtimechat.dto.message.SendMessageRequest;
import com.example.realtimechat.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWsController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWsController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Client SEND tới:
     *  /app/server/{serverId}/channel/{channelId}/send
     *
     * Server broadcast ra:
     *  /topic/server/{serverId}/channel/{channelId}
     */
    @MessageMapping("/server/{serverId}/channel/{channelId}/send")
    public void send(
            @DestinationVariable String serverId,
            @DestinationVariable String channelId,
            @Valid @Payload SendMessageRequest payload,
            Principal principal
    ) {
        if (principal == null || principal.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }

        String senderId = principal.getName();
        MessageResponse saved = messageService.sendMessage(
                serverId,
                channelId,
                senderId,
                payload.getContent(),
                payload.getReplyToMessageId()
        );

        String topic = "/topic/server/" + serverId + "/channel/" + channelId;
        messagingTemplate.convertAndSend(topic, saved);
    }
}