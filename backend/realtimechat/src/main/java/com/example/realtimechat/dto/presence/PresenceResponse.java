package com.example.realtimechat.dto.presence;

import com.example.realtimechat.model.PresenceStatus;
import java.time.Instant;

public class PresenceResponse {
    private String userId;
    private String username;
    private PresenceStatus status;
    private PresenceStatus manualStatus;
    private Instant lastSeen;
    private String activityMessage;

    public PresenceResponse() {
    }

    public PresenceResponse(String userId, String username, PresenceStatus status, PresenceStatus manualStatus, Instant lastSeen,
            String activityMessage) {
        this.userId = userId;
        this.username = username;
        this.status = status;
        this.manualStatus = manualStatus;
        this.lastSeen = lastSeen;
        this.activityMessage = activityMessage;
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

    public PresenceStatus getStatus() {
        return status;
    }

    public void setStatus(PresenceStatus status) {
        this.status = status;
    }

    public PresenceStatus getManualStatus() {
        return manualStatus;
    }

    public void setManualStatus(PresenceStatus manualStatus) {
        this.manualStatus = manualStatus;
    }

    public Instant getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(Instant lastSeen) {
        this.lastSeen = lastSeen;
    }

    public String getActivityMessage() {
        return activityMessage;
    }

    public void setActivityMessage(String activityMessage) {
        this.activityMessage = activityMessage;
    }
}
