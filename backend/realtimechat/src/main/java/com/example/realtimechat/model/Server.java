package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
//Document đại diện cho 1 server(group chat)
@Document(collection = "servers")
public class Server {
    @Id
    private String id;

    @Indexed
    private String ownerId;

    @Indexed
    private String name;

    @Indexed(unique = true)
    private String inviteCode;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Server() {}

    public Server(String ownerId, String name, String inviteCode) {
        this.ownerId = ownerId;
        this.name = name;
        this.inviteCode = inviteCode;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public String getInviteCode() { return inviteCode; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public void setName(String name) { this.name = name; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}