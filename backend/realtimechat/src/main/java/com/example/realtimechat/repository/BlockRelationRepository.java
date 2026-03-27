package com.example.realtimechat.repository;

import com.example.realtimechat.model.BlockRelation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockRelationRepository extends MongoRepository<BlockRelation, String> {
    Optional<BlockRelation> findByBlockerIdAndBlockedId(String blockerId, String blockedId);
    boolean existsByBlockerIdAndBlockedId(String blockerId, String blockedId);
}
