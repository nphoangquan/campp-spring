package com.example.realtimechat.repository;

import com.example.realtimechat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MessageRepository extends MongoRepository<Message, String> {
    Page<Message> findByChannelIdAndDeletedFalseOrderByCreatedAtDesc(String channelId, Pageable pageable);
}