package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Quan hệ bạn bè giữa 2 user.
 * Compound index (senderId, receiverId) unique để tránh duplicate request.
 */
@Document(collection = "friendships")
@CompoundIndex(name = "idx_sender_receiver", def = "{'senderId': 1, 'receiverId': 1}", unique = true)
public class Friendship {

    @Id
    private String id;

    @Indexed
    private String senderId;

    @Indexed
    private String receiverId;

    private FriendshipStatus status = FriendshipStatus.PENDING;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Friendship() {
    }

    public Friendship(String senderId, String receiverId) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.status = FriendshipStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public FriendshipStatus getStatus() {
        return status;
    }

    public void setStatus(FriendshipStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
