package com.example.realtimechat.dto.server;

import java.time.Instant;

public class ServerMemberResponse {
    private String userId;
    private String username;
    private String role;
    private Instant joinedAt;

    public ServerMemberResponse() {
    }

    public ServerMemberResponse(String userId, String username, String role, Instant joinedAt) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.joinedAt = joinedAt;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}
