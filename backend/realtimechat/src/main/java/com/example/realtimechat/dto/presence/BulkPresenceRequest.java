package com.example.realtimechat.dto.presence;

import java.util.List;

public class BulkPresenceRequest {
    private List<String> userIds;

    public BulkPresenceRequest() {
    }

    public List<String> getUserIds() {
        return userIds;
    }

    public void setUserIds(List<String> userIds) {
        this.userIds = userIds;
    }
}
