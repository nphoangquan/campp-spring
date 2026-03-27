package com.example.realtimechat.websocket;

import com.example.realtimechat.dto.presence.PresenceResponse;
import com.example.realtimechat.dto.voice.VoiceParticipantDTO;
import com.example.realtimechat.dto.voice.VoiceSignalMessage;
import com.example.realtimechat.repository.UserRepository;
import com.example.realtimechat.service.PresenceService;
import com.example.realtimechat.service.VoiceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

/**
 * Lắng nghe sự kiện kết nối / ngắt kết nối WebSocket để cập nhật presence.
 * Broadcast PresenceResponse tới /topic/presence mỗi khi trạng thái thay đổi.
 */
@Component
public class PresenceEventListener {

    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry simpUserRegistry;
    private final VoiceService voiceService;

    public PresenceEventListener(PresenceService presenceService,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            SimpUserRegistry simpUserRegistry,
            VoiceService voiceService) {
        this.presenceService = presenceService;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.simpUserRegistry = simpUserRegistry;
        this.voiceService = voiceService;
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal == null)
            return;

        String userId = principal.getName();
        presenceService.setOnline(userId);
        PresenceResponse resp = presenceService.getPresence(userId);
        messagingTemplate.convertAndSend("/topic/presence", resp);
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal == null)
            return;

        String userId = principal.getName();
        SimpUser simpUser = simpUserRegistry.getUser(userId);
        if (simpUser != null && simpUser.getSessions().size() > 0) {
            return;
        }
        
        presenceService.setOffline(userId);
        PresenceResponse resp = presenceService.getPresence(userId);
        messagingTemplate.convertAndSend("/topic/presence", resp);

        // Also leave Voice Channel if they were in one
        String channelId = voiceService.getUserChannel(userId);
        if (channelId != null) {
            voiceService.leaveChannel(userId, channelId);
            VoiceSignalMessage msg = new VoiceSignalMessage();
            msg.setType(VoiceSignalMessage.SignalType.USER_LEFT);
            msg.setSenderId(userId);
            msg.setChannelId(channelId);
            messagingTemplate.convertAndSend("/topic/voice/" + channelId, msg);
        }
    }
}
