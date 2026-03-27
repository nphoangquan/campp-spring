package com.example.realtimechat.dto.server;
//Trả message  khi join/leave server
public class JoinLeaveResponse {
    private String message;

    public JoinLeaveResponse() {}
    public JoinLeaveResponse(String message) { this.message = message; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}