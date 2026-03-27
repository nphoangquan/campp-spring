package com.example.realtimechat.dto.server;
//Trả thông tin server trong danh sách "server của tôi"
public class ServerListItemResponse {
    private String id;
    private String name;
    private String role; // OWNER/ADMIN/MEMBER...

    public ServerListItemResponse() {}

    public ServerListItemResponse(String id, String name, String role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getRole() { return role; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
}