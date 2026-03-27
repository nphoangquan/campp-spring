package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
//Entity MongoDB đại diện cho user trong hệ thống
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private byte[] avatarData;

    private String avatarContentType;

    private Set<UserRole> roles = new HashSet<>();

    private boolean isVerified = false;

    private String verificationCode;

    private Instant verificationCodeExpiry;

    private Instant createdAt = Instant.now();

    public User() {}

    public User(String username, String email, String passwordHash, Set<UserRole> roles) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.roles = roles;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public byte[] getAvatarData() { return avatarData; }
    public String getAvatarContentType() { return avatarContentType; }
    public Set<UserRole> getRoles() { return roles; }
    public boolean isVerified() { return isVerified; }
    public String getVerificationCode() { return verificationCode; }
    public Instant getVerificationCodeExpiry() { return verificationCodeExpiry; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setAvatarData(byte[] avatarData) { this.avatarData = avatarData; }
    public void setAvatarContentType(String avatarContentType) { this.avatarContentType = avatarContentType; }
    public void setRoles(Set<UserRole> roles) { this.roles = roles; }
    public void setVerified(boolean verified) { isVerified = verified; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }
    public void setVerificationCodeExpiry(Instant verificationCodeExpiry) { this.verificationCodeExpiry = verificationCodeExpiry; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
