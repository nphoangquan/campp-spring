package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

//Document đại diện cho channel(text/voice)
@Document(collection = "channels")
@CompoundIndexes({
        // Tối ưu: findByServerIdOrderByPositionAsc
        @CompoundIndex(name = "idx_server_pos", def = "{'serverId': 1, 'position': 1}"),
        // Tối ưu: findByServerIdAndCategoryIdOrderByPositionAsc
        @CompoundIndex(name = "idx_server_category_pos", def = "{'serverId': 1, 'categoryId': 1, 'position': 1}")
})
public class Channel {
    @Id
    private String id;

    private String serverId;

    private String categoryId; // có thể null nếu muốn channel không thuộc category

    private String name;

    @Indexed
    private ChannelType type = ChannelType.TEXT;

    private int position = 0;

    // Optional override permissions per role in this channel
    private Map<ServerMemberRole, Set<Permission>> rolePermissions = new HashMap<>();

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Channel() {
    }

    public Channel(String serverId, String categoryId, String name, ChannelType type, int position) {
        this.serverId = serverId;
        this.categoryId = categoryId;
        this.name = name;
        this.type = type;
        this.position = position;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Map<ServerMemberRole, Set<Permission>> getRolePermissions() {
        return rolePermissions;
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

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setRolePermissions(Map<ServerMemberRole, Set<Permission>> rolePermissions) {
        this.rolePermissions = rolePermissions;
    }
}