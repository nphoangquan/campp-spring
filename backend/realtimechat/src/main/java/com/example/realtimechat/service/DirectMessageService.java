package com.example.realtimechat.service;

import com.example.realtimechat.dto.dm.DmPageResponse;
import com.example.realtimechat.dto.dm.DmResponse;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.DirectMessage;
import com.example.realtimechat.model.User;
import com.example.realtimechat.model.BlockRelation;
import com.example.realtimechat.repository.BlockRelationRepository;
import com.example.realtimechat.repository.DirectMessageRepository;
import com.example.realtimechat.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DirectMessageService {

    private final DirectMessageRepository dmRepository;
    private final UserRepository userRepository;
    private final FriendService friendService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BlockRelationRepository blockRelationRepository;

    public DirectMessageService(DirectMessageRepository dmRepository,
            UserRepository userRepository,
            FriendService friendService,
            SimpMessagingTemplate messagingTemplate,
            BlockRelationRepository blockRelationRepository) {
        this.dmRepository = dmRepository;
        this.userRepository = userRepository;
        this.friendService = friendService;
        this.messagingTemplate = messagingTemplate;
        this.blockRelationRepository = blockRelationRepository;
    }

    /**
     * Gửi DM. Yêu cầu 2 người phải là bạn bè (ACCEPTED).
     */
    public DmResponse sendDm(String senderId, String receiverId, String content, String replyToMessageId) {
        // Kiểm tra receiver tồn tại
        userRepository.findById(receiverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Receiver not found"));

        // Kiểm tra bạn bè
        if (!friendService.areFriends(senderId, receiverId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You must be friends to send a direct message");
        }

        // Kiểm tra block
        if (blockRelationRepository.existsByBlockerIdAndBlockedId(senderId, receiverId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You have blocked this user");
        }
        if (blockRelationRepository.existsByBlockerIdAndBlockedId(receiverId, senderId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are blocked by this user");
        }

        DirectMessage dm = new DirectMessage(senderId, receiverId, content);
        dm.setReplyToMessageId(replyToMessageId);
        dm = dmRepository.save(dm);
        return toResponse(dm, senderId);
    }

    public com.example.realtimechat.dto.dm.BlockStatusDto getBlockStatus(String userId, String otherId) {
        boolean blockedByUs = blockRelationRepository.existsByBlockerIdAndBlockedId(userId, otherId);
        boolean blockedByThem = blockRelationRepository.existsByBlockerIdAndBlockedId(otherId, userId);
        
        if (blockedByUs) {
            String blockerName = userRepository.findById(userId).map(User::getUsername).orElse("Unknown");
            return new com.example.realtimechat.dto.dm.BlockStatusDto(true, true, blockerName);
        } else if (blockedByThem) {
            String blockerName = userRepository.findById(otherId).map(User::getUsername).orElse("Unknown");
            return new com.example.realtimechat.dto.dm.BlockStatusDto(true, false, blockerName);
        }
        return new com.example.realtimechat.dto.dm.BlockStatusDto(false, false, null);
    }

    public void blockUser(String userId, String targetId) {
        if (!blockRelationRepository.existsByBlockerIdAndBlockedId(userId, targetId)) {
            blockRelationRepository.save(new BlockRelation(userId, targetId));
            java.util.Map<String, String> payload = new java.util.HashMap<>();
            payload.put("error", "block_status_changed");
            messagingTemplate.convertAndSendToUser(userId, "/queue/dm-error", payload);
            messagingTemplate.convertAndSendToUser(targetId, "/queue/dm-error", payload);
        }
    }

    public void unblockUser(String userId, String targetId) {
        blockRelationRepository.findByBlockerIdAndBlockedId(userId, targetId)
                .ifPresent(rel -> {
                    blockRelationRepository.delete(rel);
                    java.util.Map<String, String> payload = new java.util.HashMap<>();
                    payload.put("error", "block_status_changed");
                    messagingTemplate.convertAndSendToUser(userId, "/queue/dm-error", payload);
                    messagingTemplate.convertAndSendToUser(targetId, "/queue/dm-error", payload);
                });
    }

    /**
     * Lấy lịch sử DM giữa 2 user, sắp xếp từ mới nhất → cũ nhất.
     */
    public DmPageResponse getHistory(String currentUserId, String otherId, int page, int size) {
        if (page < 0)
            page = 0;
        if (size <= 0 || size > 100)
            size = 30;

        // Kiểm tra bạn bè
        if (!friendService.areFriends(currentUserId, otherId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You must be friends to view DM history");
        }

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DirectMessage> pageResult = dmRepository.findConversation(currentUserId, otherId, pageable);

        // Batch fetch usernames
        List<String> senderIds = pageResult.getContent().stream()
                .map(DirectMessage::getSenderId).distinct().collect(Collectors.toList());
        Map<String, String> usernameMap = userRepository.findByIdIn(senderIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        List<DmResponse> items = pageResult.getContent().stream()
                .map(dm -> {
                    String uname = usernameMap.getOrDefault(dm.getSenderId(), "Unknown");
                    return toResponseWithUsername(dm, uname);
                })
                .collect(Collectors.toList());

        DmPageResponse resp = new DmPageResponse();
        resp.setItems(items);
        resp.setPage(pageResult.getNumber());
        resp.setSize(pageResult.getSize());
        resp.setTotalItems(pageResult.getTotalElements());
        resp.setTotalPages(pageResult.getTotalPages());
        return resp;
    }

    public DmResponse reactMessage(String messageId, String userId, String emoji, boolean isAdding) {
        DirectMessage dm = dmRepository.findById(messageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Message not found"));
        
        // Verify user can access this message (they are sender or receiver)
        if (!dm.getSenderId().equals(userId) && !dm.getReceiverId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not your message");
        }

        Map<String, Set<String>> reactions = dm.getReactions();
        Set<String> usersReacting = reactions.computeIfAbsent(emoji, k -> new HashSet<>());
        if (isAdding) {
            usersReacting.add(userId);
        } else {
            usersReacting.remove(userId);
            if (usersReacting.isEmpty()) {
                reactions.remove(emoji);
            }
        }
        dm.setReactions(reactions);
        dm.setEditedAt(Instant.now());
        dmRepository.save(dm);
        
        DmResponse resp = toResponse(dm, dm.getSenderId());
        broadcastDmUpdate(resp);
        return resp;
    }

    public DmResponse pinMessage(String messageId, String userId, boolean pin) {
        DirectMessage dm = dmRepository.findById(messageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Message not found"));
        
        if (!dm.getSenderId().equals(userId) && !dm.getReceiverId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not your message");
        }

        dm.setPinned(pin);
        dm.setEditedAt(Instant.now());
        dmRepository.save(dm);

        DmResponse resp = toResponse(dm, dm.getSenderId());
        broadcastDmUpdate(resp);
        return resp;
    }

    public DmResponse deleteMessage(String messageId, String userId) {
        DirectMessage dm = dmRepository.findById(messageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Message not found"));
        
        // Only sender can delete
        if (!dm.getSenderId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only sender can delete message");
        }

        dm.setDeleted(true);
        dm.setEditedAt(Instant.now());
        dmRepository.save(dm);

        DmResponse resp = toResponse(dm, dm.getSenderId());
        broadcastDmUpdate(resp);
        return resp;
    }

    private void broadcastDmUpdate(DmResponse resp) {
        messagingTemplate.convertAndSendToUser(resp.getReceiverId(), "/queue/dm", resp);
        messagingTemplate.convertAndSendToUser(resp.getSenderId(), "/queue/dm", resp);
    }

    // ---- helpers ----

    private DmResponse toResponse(DirectMessage dm, String senderId) {
        String uname = userRepository.findById(senderId).map(User::getUsername).orElse("Unknown");
        return toResponseWithUsername(dm, uname);
    }

    private DmResponse toResponseWithUsername(DirectMessage dm, String senderUsername) {
        DmResponse r = new DmResponse();
        r.setId(dm.getId());
        r.setSenderId(dm.getSenderId());
        r.setSenderUsername(senderUsername);
        r.setReceiverId(dm.getReceiverId());
        r.setContent(dm.isDeleted() ? "Tin nhắn đã bị thu hồi" : dm.getContent());
        r.setReplyToMessageId(dm.getReplyToMessageId());
        r.setPinned(dm.isPinned());
        r.setReactions(dm.getReactions());
        if (dm.getReactions() != null) {
            java.util.Map<String, java.util.List<String>> rxNames = new java.util.HashMap<>();
            dm.getReactions().forEach((emoji, userIds) -> {
                java.util.List<String> names = userIds.stream()
                    .map(uid -> userRepository.findById(uid).map(User::getUsername).orElse(uid))
                    .collect(Collectors.toList());
                rxNames.put(emoji, names);
            });
            r.setReactionUsernames(rxNames);
        }
        r.setDeleted(dm.isDeleted());
        r.setCreatedAt(dm.getCreatedAt());
        r.setEditedAt(dm.getEditedAt());
        return r;
    }
}
