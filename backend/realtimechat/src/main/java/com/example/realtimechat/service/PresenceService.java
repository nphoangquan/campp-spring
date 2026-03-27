package com.example.realtimechat.service;

import com.example.realtimechat.dto.presence.PresenceResponse;
import com.example.realtimechat.model.PresenceStatus;
import com.example.realtimechat.model.User;
import com.example.realtimechat.model.UserPresence;
import com.example.realtimechat.repository.UserPresenceRepository;
import com.example.realtimechat.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    private final UserPresenceRepository presenceRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceService(UserPresenceRepository presenceRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.presenceRepository = presenceRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void setOnline(String userId) {
        UserPresence p = presenceRepository.findByUserId(userId)
                .orElse(new UserPresence(userId, PresenceStatus.OFFLINE));
        p.setConnected(true);
        p.setLastSeen(Instant.now());
        presenceRepository.save(p);
        
        broadcastPresence(p);
    }

    public void setOffline(String userId) {
        UserPresence p = presenceRepository.findByUserId(userId)
                .orElse(new UserPresence(userId, PresenceStatus.OFFLINE));
        p.setConnected(false);
        p.setLastSeen(Instant.now());
        presenceRepository.save(p);
        
        broadcastPresence(p);
    }

    public PresenceResponse getPresence(String userId) {
        String username = userRepository.findById(userId)
                .map(User::getUsername).orElse("Unknown");
        return presenceRepository.findByUserId(userId)
                .map(p -> new PresenceResponse(p.getUserId(), username, p.getStatus(), p.getManualStatus(), p.getLastSeen(),
                        p.getActivityMessage()))
                .orElse(new PresenceResponse(userId, username, PresenceStatus.OFFLINE, null, null, null));
    }

    public List<PresenceResponse> getPresenceBulk(List<String> userIds) {
        // Batch fetch users
        Map<String, String> usernameMap = userRepository.findByIdIn(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        // Batch fetch presences
        Map<String, UserPresence> presenceMap = presenceRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(UserPresence::getUserId, p -> p));

        return userIds.stream().map(uid -> {
            String uname = usernameMap.getOrDefault(uid, "Unknown");
            UserPresence p = presenceMap.get(uid);
            if (p == null)
                return new PresenceResponse(uid, uname, PresenceStatus.OFFLINE, null, null, null);
            return new PresenceResponse(uid, uname, p.getStatus(), p.getManualStatus(), p.getLastSeen(), p.getActivityMessage());
        }).collect(Collectors.toList());
    }

    public void updateActivityMessage(String userId, String message) {
        UserPresence p = presenceRepository.findByUserId(userId)
                .orElse(new UserPresence(userId, PresenceStatus.OFFLINE));
        p.setActivityMessage(message);
        presenceRepository.save(p);

        broadcastPresence(p);
    }

    public void updateManualStatus(String userId, PresenceStatus status) {
        UserPresence p = presenceRepository.findByUserId(userId)
                .orElse(new UserPresence(userId, PresenceStatus.OFFLINE));
        p.setManualStatus(status);
        presenceRepository.save(p);

        broadcastPresence(p);
    }

    private void broadcastPresence(UserPresence p) {
        PresenceResponse resp = getPresence(p.getUserId());
        messagingTemplate.convertAndSend("/topic/presence", resp);
    }
}
