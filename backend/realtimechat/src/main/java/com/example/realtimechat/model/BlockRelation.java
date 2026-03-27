package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "block_relations")
@CompoundIndex(name = "blocker_blocked_idx", def = "{'blockerId': 1, 'blockedId': 1}", unique = true)
public class BlockRelation {
    @Id
    private String id;
    private String blockerId;
    private String blockedId;
    private Instant createdAt = Instant.now();

    public BlockRelation() {}
    public BlockRelation(String blockerId, String blockedId) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBlockerId() { return blockerId; }
    public void setBlockerId(String blockerId) { this.blockerId = blockerId; }
    public String getBlockedId() { return blockedId; }
    public void setBlockedId(String blockedId) { this.blockedId = blockedId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
