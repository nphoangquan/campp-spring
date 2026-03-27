package com.example.realtimechat.service;

import com.example.realtimechat.dto.message.MessagePageResponse;
import com.example.realtimechat.dto.message.MessageResponse;
import com.example.realtimechat.model.Channel;
import com.example.realtimechat.model.Message;
import com.example.realtimechat.model.ServerMember;
import com.example.realtimechat.model.User;
import com.example.realtimechat.repository.ChannelRepository;
import com.example.realtimechat.repository.MessageRepository;
import com.example.realtimechat.repository.RolePermissionRepository;
import com.example.realtimechat.repository.ServerMemberRepository;
import com.example.realtimechat.repository.UserRepository;
import org.springframework.data.domain.*;
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
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(
            MessageRepository messageRepository,
            ChannelRepository channelRepository,
            UserRepository userRepository,
            ServerMemberRepository serverMemberRepository,
            RolePermissionRepository rolePermissionRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
        this.serverMemberRepository = serverMemberRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public MessageResponse sendMessage(String serverId, String channelId, String senderId, String content,
            String replyToMessageId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));

        // đảm bảo channel thuộc server
        if (channel.getServerId() == null || !channel.getServerId().equals(serverId)) {
            throw new RuntimeException("Channel does not belong to server");
        }

        // check member server
        ServerMember member = serverMemberRepository.findByServerIdAndUserId(serverId, sender.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this server"));

        // Phase 4: check SEND_MESSAGE permission
        // Priority: channel-level override > server-level override > role default
        Set<com.example.realtimechat.model.Permission> effectivePermissions;
        if (channel.getRolePermissions() != null && channel.getRolePermissions().containsKey(member.getRole())) {
            // 1. Channel-level override
            effectivePermissions = channel.getRolePermissions().get(member.getRole());
        } else {
            // 2. Server-level override (from RolePermissionOverride), or role default
            effectivePermissions = rolePermissionRepository
                    .findByServerIdAndRole(serverId, member.getRole())
                    .map(o -> o.getPermissions())
                    .orElse(member.getRole().getDefaultPermissions());
        }

        boolean hasPerm = effectivePermissions.contains(com.example.realtimechat.model.Permission.SEND_MESSAGE);

        if (!hasPerm) {
            throw new RuntimeException("Missing SEND_MESSAGE permission in this channel");
        }

        Message msg = new Message();
        msg.setServerId(serverId);
        msg.setChannelId(channelId);
        msg.setSenderId(sender.getId());
        msg.setSenderEmail(sender.getEmail());
        msg.setContent(content);
        msg.setReplyToMessageId(replyToMessageId);
        msg.setDeleted(false);
        msg.setCreatedAt(Instant.now());

        Message saved = messageRepository.save(msg);
        return toResponse(saved);
    }

    public MessagePageResponse getChannelHistory(String channelId, int page, int size) {
        if (page < 0)
            page = 0;
        if (size <= 0)
            size = 20;
        if (size > 100)
            size = 100;

        // Sort chỉ định 1 lần qua method name (OrderByCreatedAtDesc)
        // Không truyền Sort vào Pageable để tránh double sort
        Pageable pageable = PageRequest.of(page, size);
        Page<Message> p = messageRepository.findByChannelIdAndDeletedFalseOrderByCreatedAtDesc(channelId, pageable);

        List<MessageResponse> items = p.getContent().stream().map(this::toResponse).toList();

        MessagePageResponse resp = new MessagePageResponse();
        resp.setItems(items);
        resp.setPage(p.getNumber());
        resp.setSize(p.getSize());
        resp.setTotalItems(p.getTotalElements());
        resp.setTotalPages(p.getTotalPages());
        return resp;
    }

    public MessageResponse reactMessage(String messageId, String userId, String emoji, boolean isAdding) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        Map<String, Set<String>> reactions = msg.getReactions();
        Set<String> usersReacting = reactions.computeIfAbsent(emoji, k -> new HashSet<>());
        if (isAdding) {
            usersReacting.add(userId);
        } else {
            usersReacting.remove(userId);
            if (usersReacting.isEmpty()) {
                reactions.remove(emoji);
            }
        }
        msg.setReactions(reactions);
        msg.setEditedAt(Instant.now());
        messageRepository.save(msg);

        MessageResponse resp = toResponse(msg);
        broadcastMessageUpdate(resp);
        return resp;
    }

    public MessageResponse pinMessage(String messageId, String userId, boolean pin) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        // TODO: check MANAGE_MESSAGES permission for pinning?
        // for now allow sender or anyone
        msg.setPinned(pin);
        msg.setEditedAt(Instant.now());
        messageRepository.save(msg);

        MessageResponse resp = toResponse(msg);
        broadcastMessageUpdate(resp);
        return resp;
    }

    public MessageResponse deleteMessage(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            // Check MANAGE_MESSAGES permission if not sender -> left for future.
            throw new RuntimeException("Only sender can delete message");
        }

        msg.setDeleted(true);
        msg.setEditedAt(Instant.now());
        messageRepository.save(msg);

        MessageResponse resp = toResponse(msg);
        broadcastMessageUpdate(resp);
        return resp;
    }

    private void broadcastMessageUpdate(MessageResponse resp) {
        String dest = "/topic/server/" + resp.getServerId() + "/channel/" + resp.getChannelId();
        messagingTemplate.convertAndSend(dest, resp);
    }

    private MessageResponse toResponse(Message m) {
        MessageResponse r = new MessageResponse();
        r.setId(m.getId());
        r.setServerId(m.getServerId());
        r.setChannelId(m.getChannelId());
        r.setSenderId(m.getSenderId());
        r.setSenderEmail(m.getSenderEmail());
        r.setContent(m.isDeleted() ? "Tin nhắn đã bị thu hồi" : m.getContent());
        r.setReplyToMessageId(m.getReplyToMessageId());
        r.setPinned(m.isPinned());
        r.setReactions(m.getReactions());
        if (m.getReactions() != null) {
            java.util.Map<String, java.util.List<String>> rxNames = new java.util.HashMap<>();
            m.getReactions().forEach((emoji, userIds) -> {
                java.util.List<String> names = userIds.stream()
                        .map(uid -> userRepository.findById(uid).map(User::getUsername).orElse(uid))
                        .collect(Collectors.toList());
                rxNames.put(emoji, names);
            });
            r.setReactionUsernames(rxNames);
        }
        r.setDeleted(m.isDeleted());
        r.setCreatedAt(m.getCreatedAt());
        r.setEditedAt(m.getEditedAt());
        return r;
    }
}