package com.example.realtimechat.service;

import com.example.realtimechat.dto.friend.FriendResponse;
import com.example.realtimechat.exception.ApiException;
import com.example.realtimechat.model.Friendship;
import com.example.realtimechat.model.FriendshipStatus;
import com.example.realtimechat.model.User;
import com.example.realtimechat.repository.FriendshipRepository;
import com.example.realtimechat.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public FriendService(FriendshipRepository friendshipRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /** Gửi lời mời kết bạn */
    public FriendResponse sendRequest(String senderId, String receiverId) {
        if (senderId.equals(receiverId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot send friend request to yourself");
        }

        // Kiểm tra receiver tồn tại
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // Không cho gửi khi đã có mối quan hệ
        friendshipRepository.findAnyBetween(senderId, receiverId).ifPresent(f -> {
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new ApiException(HttpStatus.CONFLICT, "Already friends");
            }
            if (f.getStatus() == FriendshipStatus.PENDING) {
                throw new ApiException(HttpStatus.CONFLICT, "Friend request already pending");
            }
            // REJECTED → xoá để cho gửi lại
            friendshipRepository.delete(f);
        });

        Friendship f = friendshipRepository.save(new Friendship(senderId, receiverId));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sender not found"));

        FriendResponse forSender = toResponse(f, senderId, receiver.getUsername());

        // 📣 Notify receiver qua WebSocket: họ có lời mời mới
        // Client của receiver subscribe /user/{receiverId}/queue/friend-requests
        FriendResponse forReceiver = toResponse(f, receiverId, sender.getUsername());
        messagingTemplate.convertAndSendToUser(receiverId, "/queue/friend-requests", forReceiver);

        return forSender;
    }

    /** Chấp nhận lời mời kết bạn */
    public FriendResponse acceptRequest(String receiverId, String friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Friendship not found"));

        if (!f.getReceiverId().equals(receiverId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to accept this request");
        }
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request is not in PENDING state");
        }

        f.setStatus(FriendshipStatus.ACCEPTED);
        f.setUpdatedAt(Instant.now());
        friendshipRepository.save(f);

        String senderId = f.getSenderId();
        User sender = userRepository.findById(senderId)
                .map(u -> u).orElse(null);
        User receiver = userRepository.findById(receiverId).orElse(null);

        String senderUsername = sender != null ? sender.getUsername() : "Unknown";
        String receiverUsername = receiver != null ? receiver.getUsername() : "Unknown";

        FriendResponse forReceiver = toResponse(f, receiverId, senderUsername);

        // 📣 Notify sender: lời mời đã được chấp nhận
        FriendResponse forSender = toResponse(f, senderId, receiverUsername);
        messagingTemplate.convertAndSendToUser(senderId, "/queue/friend-requests", forSender);

        return forReceiver;
    }

    /** Từ chối lời mời kết bạn */
    public void rejectRequest(String receiverId, String friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Friendship not found"));

        if (!f.getReceiverId().equals(receiverId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to reject this request");
        }
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request is not in PENDING state");
        }

        f.setStatus(FriendshipStatus.REJECTED);
        f.setUpdatedAt(Instant.now());
        friendshipRepository.save(f);
    }

    /** Xoá bạn bè / huỷ lời mời */
    public void removeFriend(String userId, String friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Friendship not found"));

        if (!f.getSenderId().equals(userId) && !f.getReceiverId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized");
        }

        friendshipRepository.delete(f);
    }

    /** Danh sách bạn bè (ACCEPTED) */
    public List<FriendResponse> listFriends(String userId) {
        List<Friendship> friends = friendshipRepository.findByUserIdAndStatus(userId, FriendshipStatus.ACCEPTED);
        return enrichFriendships(userId, friends);
    }

    /** Lời mời kết bạn đến (PENDING, receiverId = userId) */
    public List<FriendResponse> listIncomingRequests(String userId) {
        List<Friendship> pending = friendshipRepository.findByReceiverIdAndStatus(userId, FriendshipStatus.PENDING);
        return enrichFriendships(userId, pending);
    }

    /** Lời mời kết bạn đã gửi (PENDING, senderId = userId) */
    public List<FriendResponse> listOutgoingRequests(String userId) {
        List<Friendship> pending = friendshipRepository.findBySenderIdAndStatus(userId, FriendshipStatus.PENDING);
        return enrichFriendships(userId, pending);
    }

    /** Kiểm tra 2 user có là bạn không */
    public boolean areFriends(String userIdA, String userIdB) {
        return friendshipRepository.findAcceptedBetween(userIdA, userIdB).isPresent();
    }

    // ---- helpers ----

    private List<FriendResponse> enrichFriendships(String currentUserId, List<Friendship> list) {
        List<String> otherIds = list.stream()
                .map(f -> f.getSenderId().equals(currentUserId) ? f.getReceiverId() : f.getSenderId())
                .collect(Collectors.toList());

        Map<String, String> usernameMap = userRepository.findByIdIn(otherIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        List<FriendResponse> result = new ArrayList<>();
        for (Friendship f : list) {
            String otherId = f.getSenderId().equals(currentUserId) ? f.getReceiverId() : f.getSenderId();
            String otherUsername = usernameMap.getOrDefault(otherId, "Unknown");
            result.add(toResponse(f, currentUserId, otherUsername));
        }
        return result;
    }

    private FriendResponse toResponse(Friendship f, String currentUserId, String otherUsername) {
        String otherId = f.getSenderId().equals(currentUserId) ? f.getReceiverId() : f.getSenderId();
        return new FriendResponse(f.getId(), otherId, otherUsername, f.getStatus(), f.getCreatedAt());
    }
}
