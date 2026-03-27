package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Lưu refresh token đã bị thu hồi (logout).
 * TTL index trên expiresAt: MongoDB tự động xóa document khi token hết hạn
 * → không cần job cleanup thủ công.
 */
@Document(collection = "token_blacklist")
public class TokenBlacklist {

    @Id
    private String id;

    /** SHA-256 hash của refresh token – tránh lưu raw token */
    @Indexed(unique = true)
    private String tokenHash;

    /**
     * Thời điểm token gốc hết hạn – MongoDB TTL index sẽ xóa document này tự động
     */
    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;

    private Instant createdAt = Instant.now();

    public TokenBlacklist() {
    }

    public TokenBlacklist(String tokenHash, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
