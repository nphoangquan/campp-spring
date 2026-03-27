package com.example.realtimechat.websocket;

import com.example.realtimechat.security.JwtService;
import com.example.realtimechat.repository.UserRepository;
import com.example.realtimechat.model.User;
import org.springframework.lang.NonNull;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public StompAuthChannelInterceptor(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null)
            return message;

        StompCommand cmd = accessor.getCommand();
        if (cmd == null)
            return message;

        if (StompCommand.CONNECT.equals(cmd) || StompCommand.SEND.equals(cmd) || StompCommand.SUBSCRIBE.equals(cmd)) {
            String token = extractToken(accessor);
            if (token != null && !token.isBlank()) {
                Authentication auth = authenticateFromToken(token);
                if (auth != null) {
                    accessor.setUser(new StompPrincipal(auth.getName()));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // Ưu tiên header Authorization: Bearer xxx
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String raw = authHeaders.get(0);
            return stripBearer(raw);
        }

        // Hoặc header token: xxx
        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return stripBearer(tokenHeaders.get(0));
        }

        // Hoặc lấy từ handshake attributes: token=xxx
        Object handshakeToken = accessor.getSessionAttributes() != null ? accessor.getSessionAttributes().get("token")
                : null;
        if (handshakeToken instanceof String s && !s.isBlank()) {
            return stripBearer(s);
        }

        return null;
    }

    private String stripBearer(String raw) {
        if (raw == null)
            return null;
        String v = raw.trim();
        if (v.toLowerCase().startsWith("bearer "))
            return v.substring(7).trim();
        return v;
    }

    private Authentication authenticateFromToken(String token) {
        try {
            String email = jwtService.extractUsername(token);
            if (email == null || email.isBlank())
                return null;

            if (!jwtService.isTokenValid(token))
                return null;

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty())
                return null;

            User user = userOpt.get();

            List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));

            // ✅ FIX: dùng userId (không phải email) làm principal name
            // để nhất quán với JwtAuthFilter và DmWsController.convertAndSendToUser(userId,
            // ...)
            // Client subscribe: /user/{userId}/queue/dm → principal.getName() phải = userId
            return new UsernamePasswordAuthenticationToken(user.getId(), null, authorities);
        } catch (Exception e) {
            return null;
        }
    }

    private static class StompPrincipal implements Principal {
        private final String name;

        private StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}