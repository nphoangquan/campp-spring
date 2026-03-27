package com.example.realtimechat.dto.dm;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.List;

public class DmResponse {
    private String id;
    private String senderId;
    private String senderUsername;
    private String receiverId;
    private String content;
    private String replyToMessageId;
    private boolean pinned;
    private Map<String, Set<String>> reactions;
    private Map<String, List<String>> reactionUsernames;
    private boolean deleted;
    private Instant createdAt;
    private Instant editedAt;

    public DmResponse() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public void setSenderUsername(String senderUsername) {
        this.senderUsername = senderUsername;
    }

    public String getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(Instant editedAt) {
        this.editedAt = editedAt;
    }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }

    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }

    public Map<String, Set<String>> getReactions() { return reactions; }
    public void setReactions(Map<String, Set<String>> reactions) { this.reactions = reactions; }

    public Map<String, List<String>> getReactionUsernames() { return reactionUsernames; }
    public void setReactionUsernames(Map<String, List<String>> reactionUsernames) { this.reactionUsernames = reactionUsernames; }
}
