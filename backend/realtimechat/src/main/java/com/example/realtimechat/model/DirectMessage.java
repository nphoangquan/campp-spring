package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Tin nhắn trực tiếp (Direct Message) giữa 2 user.
 * Soft delete được hỗ trợ qua trường `deleted`.
 */
@Document(collection = "direct_messages")
@CompoundIndexes({
        @CompoundIndex(name = "idx_dm_sender_receiver_time", def = "{'senderId': 1, 'receiverId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_dm_receiver_sender_time", def = "{'receiverId': 1, 'senderId': 1, 'createdAt': -1}")
})
public class DirectMessage {

    @Id
    private String id;

    private String senderId;
    private String receiverId;

    private String content;

    private String replyToMessageId;

    private boolean deleted = false;

    private boolean pinned = false;

    private Map<String, Set<String>> reactions = new HashMap<>();

    private Instant createdAt = Instant.now();
    private Instant editedAt;

    public DirectMessage() {
    }

    public DirectMessage(String senderId, String receiverId, String content) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.deleted = false;
        this.createdAt = Instant.now();
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
}
