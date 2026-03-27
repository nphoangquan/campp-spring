package com.example.realtimechat.controller;

import com.example.realtimechat.dto.voice.VoiceSignalMessage;
import com.example.realtimechat.service.VoiceService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;

@Controller
public class VoiceSignalController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final VoiceService voiceService;

    public VoiceSignalController(SimpMessagingTemplate messagingTemplate, VoiceService voiceService) {
        this.messagingTemplate = messagingTemplate;
        this.voiceService = voiceService;
    }

    @MessageMapping("/voice.signal")
    public void handleSignal(@Payload VoiceSignalMessage message, SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        
        String senderId = principal.getName();
        String channelId = message.getChannelId();
        
        if (channelId == null || channelId.isBlank()) {
            return;
        }

        if (message.getType() == VoiceSignalMessage.SignalType.STATE_UPDATE) {
            try {
                java.util.LinkedHashMap<?, ?> map = (java.util.LinkedHashMap<?, ?>) message.getPayload();
                boolean micOn = (Boolean) map.get("micOn");
                boolean camOn = (Boolean) map.get("camOn");
                boolean screenOn = (Boolean) map.get("screenShareOn");
                voiceService.updateParticipantState(channelId, senderId, micOn, camOn, screenOn);
            } catch(Exception e) {
                // Ignore parsing exceptions
            }
            message.setSenderId(senderId);
            messagingTemplate.convertAndSend("/topic/voice/" + channelId, message);
        } else {
            // OFFER, ANSWER, ICE_CANDIDATE target a specific user within the channel
            // In SFU or mesh, these signals need to be routed. We broadcast them and the client will verify targetId.
            message.setSenderId(senderId);
            messagingTemplate.convertAndSend("/topic/voice/" + channelId, message);
        }
    }
}
