package com.example.realtimechat.controller;

import com.example.realtimechat.dto.category.*;
import com.example.realtimechat.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
//API category
@RestController
@RequestMapping("/servers/{serverId}/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private String userId(Authentication auth) {
        return auth.getName();
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(Authentication auth, @PathVariable String serverId,
                                                  @Valid @RequestBody CategoryCreateRequest req) {
        return ResponseEntity.ok(categoryService.create(userId(auth), serverId, req));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list(Authentication auth, @PathVariable String serverId) {
        return ResponseEntity.ok(categoryService.list(userId(auth), serverId));
    }

    @PatchMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> update(Authentication auth, @PathVariable String serverId,
                                                  @PathVariable String categoryId,
                                                  @Valid @RequestBody CategoryUpdateRequest req) {
        return ResponseEntity.ok(categoryService.update(userId(auth), serverId, categoryId, req));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> delete(Authentication auth, @PathVariable String serverId, @PathVariable String categoryId) {
        categoryService.delete(userId(auth), serverId, categoryId);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }
}