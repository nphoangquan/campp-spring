package com.example.realtimechat.dto.category;

import java.time.Instant;
//Trả về thông tin category
public class CategoryResponse {
    private String id;
    private String serverId;
    private String name;
    private int position;
    private Instant createdAt;
    private Instant updatedAt;

    public CategoryResponse() {}

    public CategoryResponse(String id, String serverId, String name, int position, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.serverId = serverId;
        this.name = name;
        this.position = position;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getServerId() { return serverId; }
    public String getName() { return name; }
    public int getPosition() { return position; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setServerId(String serverId) { this.serverId = serverId; }
    public void setName(String name) { this.name = name; }
    public void setPosition(int position) { this.position = position; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}