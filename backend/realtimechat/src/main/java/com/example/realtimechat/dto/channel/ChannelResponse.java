package com.example.realtimechat.dto.channel;

import com.example.realtimechat.model.ChannelType;

import java.time.Instant;

//Trả về thông tin channel
public class ChannelResponse {
    private String id;
    private String serverId;
    private String categoryId;
    private String name;
    private ChannelType type;
    private int position;
    private boolean hasActiveVoice;
    private Instant createdAt;
    private Instant updatedAt;

    public ChannelResponse() {
    }

    public ChannelResponse(
            String id, String serverId, String categoryId, String name,
            ChannelType type, int position, boolean hasActiveVoice, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.serverId = serverId;
        this.categoryId = categoryId;
        this.name = name;
        this.type = type;
        this.position = position;
        this.hasActiveVoice = hasActiveVoice;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getServerId() {
        return serverId;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public String getName() {
        return name;
    }

    public ChannelType getType() {
        return type;
    }

    public int getPosition() {
        return position;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isHasActiveVoice() {
        return hasActiveVoice;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(ChannelType type) {
        this.type = type;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public void setHasActiveVoice(boolean hasActiveVoice) {
        this.hasActiveVoice = hasActiveVoice;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}