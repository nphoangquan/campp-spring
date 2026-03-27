package com.example.realtimechat.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
//Nhận dữ liệu tạo category từ client
public class CategoryCreateRequest {
    @NotBlank
    @Size(min = 1, max = 60)
    private String name;

    private Integer position; // optional

    public String getName() { return name; }
    public Integer getPosition() { return position; }

    public void setName(String name) { this.name = name; }
    public void setPosition(Integer position) { this.position = position; }
}