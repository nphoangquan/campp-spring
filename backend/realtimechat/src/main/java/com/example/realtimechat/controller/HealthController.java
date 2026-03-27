package com.example.realtimechat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
//API test hệ thống và endpoint /me để test JWT
@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        // auth.getName() hiện là userId (mình set ở JwtAuthFilter)
        return ResponseEntity.ok(Map.of("userId", auth.getName(), "authorities", auth.getAuthorities()));
    }
}