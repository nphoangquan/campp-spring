package com.example.realtimechat.dto.voice;

public class VoiceParticipantDTO {
    private String userId;
    private String username;
    private Boolean hasAvatar = false;
    private Boolean micOn = true;
    private Boolean camOn = false;
    private Boolean screenShareOn = false;

    public VoiceParticipantDTO() {
    }

    public VoiceParticipantDTO(String userId, String username, Boolean hasAvatar, Boolean micOn, Boolean camOn, Boolean screenShareOn) {
        this.userId = userId;
        this.username = username;
        this.hasAvatar = hasAvatar;
        this.micOn = micOn;
        this.camOn = camOn;
        this.screenShareOn = screenShareOn;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Boolean isHasAvatar() {
        return hasAvatar != null ? hasAvatar : false;
    }

    public void setHasAvatar(Boolean hasAvatar) {
        this.hasAvatar = hasAvatar;
    }

    public Boolean isMicOn() {
        return micOn != null ? micOn : true;
    }

    public void setMicOn(Boolean micOn) {
        this.micOn = micOn;
    }

    public Boolean isCamOn() {
        return camOn != null ? camOn : false;
    }

    public void setCamOn(Boolean camOn) {
        this.camOn = camOn;
    }

    public Boolean isScreenShareOn() {
        return screenShareOn != null ? screenShareOn : false;
    }

    public void setScreenShareOn(Boolean screenShareOn) {
        this.screenShareOn = screenShareOn;
    }
}
