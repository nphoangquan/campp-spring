package com.example.realtimechat.repository;

import com.example.realtimechat.model.UserPresence;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserPresenceRepository extends MongoRepository<UserPresence, String> {
    Optional<UserPresence> findByUserId(String userId);

    List<UserPresence> findByUserIdIn(List<String> userIds);

    void deleteByUserId(String userId);
}
