package com.example.realtimechat.repository;

import com.example.realtimechat.model.Friendship;
import com.example.realtimechat.model.FriendshipStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends MongoRepository<Friendship, String> {

    Optional<Friendship> findBySenderIdAndReceiverId(String senderId, String receiverId);

    // Tìm friendship theo status cho một phía (dùng để tìm lời mời đến hoặc đã gửi)
    List<Friendship> findBySenderIdAndStatus(String senderId, FriendshipStatus status);

    List<Friendship> findByReceiverIdAndStatus(String receiverId, FriendshipStatus status);

    // Tìm tất cả friendship liên quan đến userId với status cho trước
    @Query("{ 'status': ?1, '$or': [ { 'senderId': ?0 }, { 'receiverId': ?0 } ] }")
    List<Friendship> findByUserIdAndStatus(String userId, FriendshipStatus status);

    // Kiểm tra hai user đã là bạn hay chưa (theo bất kỳ chiều nào)
    @Query("{ 'status': 'ACCEPTED', '$or': [ { 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 } ] }")
    Optional<Friendship> findAcceptedBetween(String userIdA, String userIdB);

    // Kiểm tra đã có pending request giữa 2 user (theo bất kỳ chiều nào)
    @Query("{ '$or': [ { 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 } ] }")
    Optional<Friendship> findAnyBetween(String userIdA, String userIdB);

    void deleteBySenderIdOrReceiverId(String senderId, String receiverId);
}
