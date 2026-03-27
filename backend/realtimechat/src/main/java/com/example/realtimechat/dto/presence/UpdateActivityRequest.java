package com.example.realtimechat.dto.presence;

public class UpdateActivityRequest {
    private String activityMessage;

    public UpdateActivityRequest() {
    }

    public UpdateActivityRequest(String activityMessage) {
        this.activityMessage = activityMessage;
    }

    public String getActivityMessage() {
        return activityMessage;
    }

    public void setActivityMessage(String activityMessage) {
        this.activityMessage = activityMessage;
    }
}
