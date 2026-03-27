package com.example.realtimechat.dto.server;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
//Nhận dữ liệu cập nhật server từ Client
public class ServerUpdateRequest {
    @NotBlank
    @Size(min = 2, max = 60)
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}