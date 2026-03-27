package com.example.realtimechat.config;

import com.example.realtimechat.websocket.StompAuthChannelInterceptor;
import com.example.realtimechat.websocket.WsHandshakeAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

//Cấu hình giao thức STOMP(Simple/Streaming Text Oriented Messaging Protocol) và endpoint cho client
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final WsHandshakeAuthInterceptor wsHandshakeAuthInterceptor;

    public WebSocketConfig(
            StompAuthChannelInterceptor stompAuthChannelInterceptor,
            WsHandshakeAuthInterceptor wsHandshakeAuthInterceptor) {
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
        this.wsHandshakeAuthInterceptor = wsHandshakeAuthInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Client sẽ connect: ws://localhost:8080/ws (hoặc SockJS)
        registry.addEndpoint("/ws")
                .addInterceptors(wsHandshakeAuthInterceptor)
                .setAllowedOriginPatterns("*"); // dev: cho phép tất cả origin
        // Nếu frontend dùng SockJS, bật dòng dưới:
        // registry.addEndpoint("/ws").addInterceptors(wsHandshakeAuthInterceptor).setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Client gửi lên prefix /app/...
        registry.setApplicationDestinationPrefixes("/app");

        // Broker phát ra cho client subscribe /topic/... và /queue/... (private)
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefix cho user-destination (DM private messages)
        // Client subscribe: /user/{userId}/queue/dm
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Interceptor để xác thực JWT cho CONNECT / SEND
        registration.interceptors(stompAuthChannelInterceptor);
    }
}