package com.example.realtimechat.controller;

import com.example.realtimechat.dto.voice.VoiceParticipantDTO;
import com.example.realtimechat.dto.voice.VoiceSignalMessage;
import com.example.realtimechat.model.User;
import com.example.realtimechat.service.UserService;
import com.example.realtimechat.service.VoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voice")
public class VoiceController {
    
    private final VoiceService voiceService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public VoiceController(VoiceService voiceService, UserService userService, SimpMessagingTemplate messagingTemplate) {
        this.voiceService = voiceService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/channels/{channelId}/join")
    public ResponseEntity<?> joinChannel(
            @AuthenticationPrincipal String userId,
            @PathVariable String channelId,
            @RequestBody VoiceParticipantDTO initialState) { 
        
        System.out.println("[DEBUG/VOICE] User " + userId + " attempting to join voice channel: " + channelId);
        
        try {
            System.out.println("[DEBUG/VOICE] Fetching user info for ID: " + userId);
            User user = userService.getUserWithAvatar(userId); 
            
            System.out.println("[DEBUG/VOICE] Building participant info...");
            VoiceParticipantDTO participant = new VoiceParticipantDTO();
            participant.setUserId(user.getId());
            participant.setUsername(user.getUsername());
            participant.setHasAvatar(user.getAvatarData() != null && user.getAvatarData().length > 0);
            participant.setMicOn(initialState != null && initialState.isMicOn());
            participant.setCamOn(initialState != null && initialState.isCamOn());
            participant.setScreenShareOn(initialState != null && initialState.isScreenShareOn());

            System.out.println("[DEBUG/VOICE] Calling voiceService.joinChannel...");
            boolean joined = voiceService.joinChannel(channelId, participant);
            if (!joined) {
                System.out.println("[DEBUG/VOICE] Channel full limit reached.");
                return ResponseEntity.badRequest().body(Map.of("message", "Kênh đàm thoại đã đầy (tối đa 6 người)."));
            }

            System.out.println("[DEBUG/VOICE] Creating VoiceSignalMessage USER_JOINED...");
            VoiceSignalMessage msg = new VoiceSignalMessage();
            msg.setType(VoiceSignalMessage.SignalType.USER_JOINED);
            msg.setSenderId(userId);
            msg.setChannelId(channelId);
            msg.setPayload(participant);
            
            System.out.println("[DEBUG/VOICE] Broadcasting to /topic/voice/" + channelId);
            messagingTemplate.convertAndSend("/topic/voice/" + channelId, msg);
            
            System.out.println("[DEBUG/VOICE] Fetching existing participants...");
            List<VoiceParticipantDTO> existing = voiceService.getParticipants(channelId);
            
            System.out.println("[DEBUG/VOICE] Join successful. Returning OK.");
            return ResponseEntity.ok(existing);
        } catch (Exception e) {
            System.err.println("[DEBUG/VOICE] ERROR IN joinChannel: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/channels/{channelId}/leave")
    public ResponseEntity<?> leaveChannel(
            @AuthenticationPrincipal String userId,
            @PathVariable String channelId) {
        
        voiceService.leaveChannel(userId, channelId);
        
        VoiceSignalMessage msg = new VoiceSignalMessage();
        msg.setType(VoiceSignalMessage.SignalType.USER_LEFT);
        msg.setSenderId(userId);
        msg.setChannelId(channelId);
        messagingTemplate.convertAndSend("/topic/voice/" + channelId, msg);
        
        return ResponseEntity.ok(Map.of("message", "Đã rời nhóm."));
    }
}
