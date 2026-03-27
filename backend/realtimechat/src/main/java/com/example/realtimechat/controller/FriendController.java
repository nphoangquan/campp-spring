package com.example.realtimechat.controller;

import com.example.realtimechat.dto.friend.FriendResponse;
import com.example.realtimechat.dto.friend.SendFriendRequestDto;
import com.example.realtimechat.repository.UserRepository;
import com.example.realtimechat.service.FriendService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;
    private final UserRepository userRepository;

    public FriendController(FriendService friendService, UserRepository userRepository) {
        this.friendService = friendService;
        this.userRepository = userRepository;
    }

    /** Gửi lời mời kết bạn */
    @PostMapping("/request")
    public ResponseEntity<FriendResponse> sendRequest(
            @Valid @RequestBody SendFriendRequestDto req) {
        FriendResponse resp = friendService.sendRequest(currentUserId(), req.getReceiverId());
        return ResponseEntity.ok(resp);
    }

    /** Chấp nhận lời mời */
    @PutMapping("/{friendshipId}/accept")
    public ResponseEntity<FriendResponse> accept(@PathVariable String friendshipId) {
        FriendResponse resp = friendService.acceptRequest(currentUserId(), friendshipId);
        return ResponseEntity.ok(resp);
    }

    /** Từ chối lời mời */
    @PutMapping("/{friendshipId}/reject")
    public ResponseEntity<Void> reject(@PathVariable String friendshipId) {
        friendService.rejectRequest(currentUserId(), friendshipId);
        return ResponseEntity.noContent().build();
    }

    /** Xoá bạn bè / huỷ lời mời */
    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<Void> remove(@PathVariable String friendshipId) {
        friendService.removeFriend(currentUserId(), friendshipId);
        return ResponseEntity.noContent().build();
    }

    /** Danh sách bạn bè (ACCEPTED) */
    @GetMapping
    public ResponseEntity<List<FriendResponse>> listFriends() {
        return ResponseEntity.ok(friendService.listFriends(currentUserId()));
    }

    /** Lời mời đến (PENDING, receiverId = me) */
    @GetMapping("/pending/incoming")
    public ResponseEntity<List<FriendResponse>> incoming() {
        return ResponseEntity.ok(friendService.listIncomingRequests(currentUserId()));
    }

    /** Lời mời đã gửi (PENDING, senderId = me) */
    @GetMapping("/pending/outgoing")
    public ResponseEntity<List<FriendResponse>> outgoing() {
        return ResponseEntity.ok(friendService.listOutgoingRequests(currentUserId()));
    }

    /**
     * Tìm user theo username (để add friend mà không cần biết userId).
     * GET /api/friends/search?username=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchUser(@RequestParam String username) {
        return userRepository.findByUsername(username)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(
                        Map.of("userId", u.getId(), "username", u.getUsername())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * BUG FIX: JwtAuthFilter set Authentication.getName() = userId (không phải
     * email).
     * Lấy userId trực tiếp từ SecurityContextHolder.
     */
    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Not authenticated");
        }
        // JwtAuthFilter line 74: new UsernamePasswordAuthenticationToken(userId, null,
        // authorities)
        // => getName() trả về userId
        return auth.getName();
    }
}
