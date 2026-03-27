package com.example.realtimechat.repository;

import com.example.realtimechat.model.DirectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface DirectMessageRepository extends MongoRepository<DirectMessage, String> {

    /**
     * Lấy lịch sử DM giữa 2 user (theo cả 2 chiều).
     */
    @Query("{ 'deleted': false, '$or': [ " +
            "{ 'senderId': ?0, 'receiverId': ?1 }, " +
            "{ 'senderId': ?1, 'receiverId': ?0 } " +
            "] }")
    Page<DirectMessage> findConversation(String userIdA, String userIdB, Pageable pageable);
}
