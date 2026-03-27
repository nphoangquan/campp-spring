package com.example.realtimechat.service;

import com.example.realtimechat.dto.category.*;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.Category;
import com.example.realtimechat.model.Permission;
import com.example.realtimechat.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

//Xử lý logic category trong server
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ServerService serverService;

    public CategoryService(CategoryRepository categoryRepository, ServerService serverService) {
        this.categoryRepository = categoryRepository;
        this.serverService = serverService;
    }

    public CategoryResponse create(String userId, String serverId, CategoryCreateRequest req) {
        // Requires MANAGE_CHANNELS permission (OWNER and ADMIN by default)
        serverService.requirePermission(userId, serverId, Permission.MANAGE_CHANNELS);

        int pos = req.getPosition() != null ? req.getPosition() : 0;
        Category c = new Category(serverId, req.getName(), pos);
        c = categoryRepository.save(c);
        return toResponse(c);
    }

    public List<CategoryResponse> list(String userId, String serverId) {
        serverService.requireMember(userId, serverId);
        return categoryRepository.findByServerIdOrderByPositionAsc(serverId)
                .stream().map(this::toResponse).toList();
    }

    public CategoryResponse update(String userId, String serverId, String categoryId, CategoryUpdateRequest req) {
        // Requires MANAGE_CHANNELS permission
        serverService.requirePermission(userId, serverId, Permission.MANAGE_CHANNELS);

        Category c = categoryRepository.findByIdAndServerId(categoryId, serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));

        c.setName(req.getName());
        if (req.getPosition() != null)
            c.setPosition(req.getPosition());
        c.setUpdatedAt(Instant.now());

        c = categoryRepository.save(c);
        return toResponse(c);
    }

    public void delete(String userId, String serverId, String categoryId) {
        // Requires MANAGE_CHANNELS permission
        serverService.requirePermission(userId, serverId, Permission.MANAGE_CHANNELS);

        Category c = categoryRepository.findByIdAndServerId(categoryId, serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));

        categoryRepository.deleteById(c.getId());
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(
                c.getId(),
                c.getServerId(),
                c.getName(),
                c.getPosition(),
                c.getCreatedAt(),
                c.getUpdatedAt());
    }
}