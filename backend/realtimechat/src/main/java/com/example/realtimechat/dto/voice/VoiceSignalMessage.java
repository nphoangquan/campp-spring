package com.example.realtimechat.dto.voice;

public class VoiceSignalMessage {
    public enum SignalType {
        USER_JOINED,
        USER_LEFT,
        STATE_UPDATE,
        OFFER,
        ANSWER,
        ICE_CANDIDATE
    }

    private SignalType type;
    private String senderId;
    private String targetId;
    private Object payload;
    private String channelId;

    public VoiceSignalMessage() {
    }

    public VoiceSignalMessage(SignalType type, String senderId, String targetId, Object payload, String channelId) {
        this.type = type;
        this.senderId = senderId;
        this.targetId = targetId;
        this.payload = payload;
        this.channelId = channelId;
    }

    public SignalType getType() {
        return type;
    }

    public void setType(SignalType type) {
        this.type = type;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }
}
