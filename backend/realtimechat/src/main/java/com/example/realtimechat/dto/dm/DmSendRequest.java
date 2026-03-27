package com.example.realtimechat.dto.dm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DmSendRequest {

    @NotBlank(message = "content is required")
    @Size(max = 4000, message = "Message too long")
    private String content;

    private String replyToMessageId;

    public DmSendRequest() {
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }
}
