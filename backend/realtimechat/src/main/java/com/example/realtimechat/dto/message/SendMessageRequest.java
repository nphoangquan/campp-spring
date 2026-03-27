package com.example.realtimechat.dto.message;

import jakarta.validation.constraints.NotBlank;

public class SendMessageRequest {

    @NotBlank
    private String content;

    private String replyToMessageId;

    public SendMessageRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }
}