package com.example.realtimechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Lưu trạng thái hiện diện (presence) của user.
 * Mỗi user có tối đa 1 document trong collection này.
 */
@Document(collection = "user_presence")
public class UserPresence {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private PresenceStatus status = PresenceStatus.OFFLINE;

    private boolean connected = false;

    private PresenceStatus manualStatus;

    private String activityMessage;

    private Instant lastSeen = Instant.now();

    public void updateCalculatedStatus() {
        if (!connected) {
            this.status = PresenceStatus.OFFLINE;
        } else {
            if (manualStatus != null) {
                this.status = manualStatus;
            } else {
                this.status = PresenceStatus.ONLINE;
            }
        }
    }

    public UserPresence() {
    }

    public UserPresence(String userId, PresenceStatus status) {
        this.userId = userId;
        this.status = status;
        this.lastSeen = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public PresenceStatus getStatus() {
        return status;
    }

    public void setStatus(PresenceStatus status) {
        this.status = status;
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

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
        updateCalculatedStatus();
    }

    public PresenceStatus getManualStatus() {
        return manualStatus;
    }

    public void setManualStatus(PresenceStatus manualStatus) {
        this.manualStatus = manualStatus;
        updateCalculatedStatus();
    }
}
