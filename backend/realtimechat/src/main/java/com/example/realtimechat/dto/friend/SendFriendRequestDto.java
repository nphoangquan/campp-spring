package com.example.realtimechat.dto.friend;

import jakarta.validation.constraints.NotBlank;

public class SendFriendRequestDto {

    @NotBlank(message = "receiverId is required")
    private String receiverId;

    public SendFriendRequestDto() {
    }

    public String getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }
}
