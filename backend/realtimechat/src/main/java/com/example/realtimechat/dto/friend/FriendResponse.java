package com.example.realtimechat.dto.friend;

import com.example.realtimechat.model.FriendshipStatus;
import java.time.Instant;

public class FriendResponse {
    private String friendshipId;
    /** Id của user phía bên kia */
    private String userId;
    private String username;
    private FriendshipStatus status;
    private Instant createdAt;

    public FriendResponse() {
    }

    public FriendResponse(String friendshipId, String userId, String username,
            FriendshipStatus status, Instant createdAt) {
        this.friendshipId = friendshipId;
        this.userId = userId;
        this.username = username;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String getFriendshipId() {
        return friendshipId;
    }

    public void setFriendshipId(String friendshipId) {
        this.friendshipId = friendshipId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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
}
