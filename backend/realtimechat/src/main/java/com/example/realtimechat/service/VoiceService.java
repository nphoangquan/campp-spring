package com.example.realtimechat.service;

import com.example.realtimechat.dto.voice.VoiceParticipantDTO;
import com.example.realtimechat.dto.voice.VoiceSignalMessage;
import com.example.realtimechat.model.Channel;
import com.example.realtimechat.repository.ChannelRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VoiceService {
    
    private final ChannelRepository channelRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public VoiceService(ChannelRepository channelRepository, SimpMessagingTemplate messagingTemplate) {
        this.channelRepository = channelRepository;
        this.messagingTemplate = messagingTemplate;
    }
    // channelId -> Map<userId, VoiceParticipantDTO>
    private final Map<String, Map<String, VoiceParticipantDTO>> channelParticipants = new ConcurrentHashMap<>();
    
    // userId -> channelId
    private final Map<String, String> userToChannelMap = new ConcurrentHashMap<>();

    public synchronized boolean joinChannel(String channelId, VoiceParticipantDTO participant) {
        Map<String, VoiceParticipantDTO> participants = channelParticipants.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        
        if (participants.size() >= 6 && !participants.containsKey(participant.getUserId())) {
            return false; 
        }

        String currentChannel = userToChannelMap.get(participant.getUserId());
        if (currentChannel != null && !currentChannel.equals(channelId)) {
            leaveChannel(participant.getUserId(), currentChannel);
        }

        participants.put(participant.getUserId(), participant);
        userToChannelMap.put(participant.getUserId(), channelId);
        
        broadcastServerVoiceStatus(channelId);
        return true;
    }

    public synchronized VoiceParticipantDTO leaveChannel(String userId, String channelId) {
        Map<String, VoiceParticipantDTO> participants = channelParticipants.get(channelId);
        VoiceParticipantDTO removed = null;
        if (participants != null) {
            removed = participants.remove(userId);
            if (participants.isEmpty()) {
                channelParticipants.remove(channelId);
            }
        }
        userToChannelMap.remove(userId);
        
        if (removed != null) {
            broadcastServerVoiceStatus(channelId);
        }
        
        return removed;
    }
    
    public synchronized VoiceParticipantDTO leaveAnyChannel(String userId) {
        String channelId = userToChannelMap.get(userId);
        if (channelId != null) {
            return leaveChannel(userId, channelId);
        }
        return null;
    }

    public synchronized void updateParticipantState(String channelId, String userId, boolean micOn, boolean camOn, boolean screenOn) {
        Map<String, VoiceParticipantDTO> participants = channelParticipants.get(channelId);
        if (participants != null && participants.containsKey(userId)) {
            VoiceParticipantDTO p = participants.get(userId);
            p.setMicOn(micOn);
            p.setCamOn(camOn);
            p.setScreenShareOn(screenOn);
        }
    }

    public List<VoiceParticipantDTO> getParticipants(String channelId) {
        Map<String, VoiceParticipantDTO> participants = channelParticipants.get(channelId);
        if (participants == null) return new ArrayList<>();
        return new ArrayList<>(participants.values());
    }

    public String getUserChannel(String userId) {
        return userToChannelMap.get(userId);
    }
    
    public boolean hasActiveParticipants(String channelId) {
        Map<String, VoiceParticipantDTO> participants = channelParticipants.get(channelId);
        return participants != null && !participants.isEmpty();
    }
    
    private void broadcastServerVoiceStatus(String channelId) {
        channelRepository.findById(channelId).ifPresent(channel -> {
            boolean active = hasActiveParticipants(channelId);
            
            // Broadcast so that clients can immediately highlight or unhighlight the channel icon
            VoiceSignalMessage msg = new VoiceSignalMessage();
            msg.setType(VoiceSignalMessage.SignalType.STATE_UPDATE);
            msg.setChannelId(channelId);
            msg.setPayload(Map.of("hasActiveVoice", active));
            
            messagingTemplate.convertAndSend("/topic/servers/" + channel.getServerId() + "/voice-status", msg);
        });
    }
}
