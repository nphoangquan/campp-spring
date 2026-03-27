package com.example.realtimechat.service;

import com.example.realtimechat.dto.channel.*;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.Channel;
import com.example.realtimechat.model.ChannelType;
import com.example.realtimechat.model.Permission;
import com.example.realtimechat.repository.CategoryRepository;
import com.example.realtimechat.repository.ChannelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

//xử lý logic channel trong server
@Service
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final CategoryRepository categoryRepository;
    private final ServerService serverService;
    private final VoiceService voiceService;

    public ChannelService(ChannelRepository channelRepository, CategoryRepository categoryRepository,
            ServerService serverService, VoiceService voiceService) {
        this.channelRepository = channelRepository;
        this.categoryRepository = categoryRepository;
        this.serverService = serverService;
        this.voiceService = voiceService;
    }

    public ChannelResponse create(String userId, String serverId, ChannelCreateRequest req) {
        // Requires CREATE_CHANNEL permission (OWNER, ADMIN, or custom override)
        serverService.requirePermission(userId, serverId, Permission.CREATE_CHANNEL);

        String categoryId = req.getCategoryId();
        if (categoryId != null && !categoryId.isBlank()) {
            categoryRepository.findByIdAndServerId(categoryId, serverId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid categoryId"));
        } else {
            categoryId = null;
        }

        ChannelType type = req.getType() != null ? req.getType() : ChannelType.TEXT;
        int pos = req.getPosition() != null ? req.getPosition() : 0;

        Channel ch = new Channel(serverId, categoryId, req.getName(), type, pos);
        ch = channelRepository.save(ch);
        return toResponse(ch);
    }

    public List<ChannelResponse> list(String userId, String serverId) {
        serverService.requireMember(userId, serverId);
        return channelRepository.findByServerIdOrderByPositionAsc(serverId)
                .stream().map(this::toResponse).toList();
    }

    public ChannelResponse update(String userId, String serverId, String channelId, ChannelUpdateRequest req) {
        // Requires MANAGE_CHANNELS permission
        serverService.requirePermission(userId, serverId, Permission.MANAGE_CHANNELS);

        Channel ch = channelRepository.findByIdAndServerId(channelId, serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Channel not found"));

        String categoryId = req.getCategoryId();
        if (categoryId != null && !categoryId.isBlank()) {
            categoryRepository.findByIdAndServerId(categoryId, serverId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid categoryId"));
            ch.setCategoryId(categoryId);
        } else if (categoryId != null) {
            // if explicitly set to blank -> detach
            ch.setCategoryId(null);
        }

        ch.setName(req.getName());
        if (req.getType() != null)
            ch.setType(req.getType());
        if (req.getPosition() != null)
            ch.setPosition(req.getPosition());
        ch.setUpdatedAt(Instant.now());

        ch = channelRepository.save(ch);
        return toResponse(ch);
    }

    public void delete(String userId, String serverId, String channelId) {
        // Requires MANAGE_CHANNELS permission
        serverService.requirePermission(userId, serverId, Permission.MANAGE_CHANNELS);

        Channel ch = channelRepository.findByIdAndServerId(channelId, serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Channel not found"));

        channelRepository.deleteById(ch.getId());
    }

    private ChannelResponse toResponse(Channel c) {
        boolean hasActiveVoice = c.getType() == ChannelType.VOICE && voiceService.hasActiveParticipants(c.getId());
        
        return new ChannelResponse(
                c.getId(),
                c.getServerId(),
                c.getCategoryId(),
                c.getName(),
                c.getType(),
                c.getPosition(),
                hasActiveVoice,
                c.getCreatedAt(),
                c.getUpdatedAt());
    }
}