package com.example.realtimechat.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
//Nhận dữ liệu cập nhật category từ client
public class CategoryUpdateRequest {
    @NotBlank
    @Size(min = 1, max = 60)
    private String name;

    private Integer position;

    public String getName() { return name; }
    public Integer getPosition() { return position; }

    public void setName(String name) { this.name = name; }
    public void setPosition(Integer position) { this.position = position; }
}