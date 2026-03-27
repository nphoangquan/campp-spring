package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

// Compound index {serverId, userId} unique để tối ưu query và tránh duplicate membership
@Document(collection = "server_members")
@CompoundIndex(name = "idx_server_user", def = "{'serverId': 1, 'userId': 1}", unique = true)
public class ServerMember {
    @Id
    private String id;

    private String serverId;

    private String userId;

    @Indexed
    private ServerMemberRole role;

    private Instant joinedAt = Instant.now();

    public ServerMember() {
    }

    public ServerMember(String serverId, String userId, ServerMemberRole role) {
        this.serverId = serverId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getServerId() {
        return serverId;
    }

    public String getUserId() {
        return userId;
    }

    public ServerMemberRole getRole() {
        return role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setRole(ServerMemberRole role) {
        this.role = role;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}