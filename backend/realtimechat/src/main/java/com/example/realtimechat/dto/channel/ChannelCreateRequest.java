package com.example.realtimechat.dto.channel;

import com.example.realtimechat.model.ChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
//Nhận dữ liệu tạo channel từ client
public class ChannelCreateRequest {
    @NotBlank
    @Size(min = 1, max = 60)
    private String name;

    private String categoryId; // optional
    private ChannelType type;  // optional default TEXT
    private Integer position;  // optional

    public String getName() { return name; }
    public String getCategoryId() { return categoryId; }
    public ChannelType getType() { return type; }
    public Integer getPosition() { return position; }

    public void setName(String name) { this.name = name; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public void setType(ChannelType type) { this.type = type; }
    public void setPosition(Integer position) { this.position = position; }
}