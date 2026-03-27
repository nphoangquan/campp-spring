package com.example.realtimechat.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DeleteAccountConfirmRequest {

    @NotBlank(message = "Code is required")
    @Size(min = 6, max = 6, message = "Code must be exactly 6 digits")
    private String code;

    public DeleteAccountConfirmRequest() {}

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
