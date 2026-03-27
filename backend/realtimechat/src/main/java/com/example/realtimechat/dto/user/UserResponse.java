package com.example.realtimechat.dto.user;

public class UserResponse {
    private String id;
    private String username;
    private String email;
    private boolean hasAvatar;

    public UserResponse() {}

    public UserResponse(String id, String username, String email, boolean hasAvatar) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.hasAvatar = hasAvatar;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isHasAvatar() { return hasAvatar; }
    public void setHasAvatar(boolean hasAvatar) { this.hasAvatar = hasAvatar; }
}
