package com.example.realtimechat.exception;

import org.springframework.http.HttpStatus;
//Custom exception kèm Http status
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}