package com.example.realtimechat.dto.presence;

import com.example.realtimechat.model.PresenceStatus;

public class UpdateStatusRequest {
    private PresenceStatus status; // Can be null for "Default", or ONLINE, IDLE, DND, INVISIBLE

    public PresenceStatus getStatus() { return status; }
    public void setStatus(PresenceStatus status) { this.status = status; }
}
