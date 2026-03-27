package com.example.realtimechat.repository;

import com.example.realtimechat.model.TokenBlacklist;
import org.springframework.data.mongodb.repository.MongoRepository;

/** Truy vấn collection token_blacklist */
public interface TokenBlacklistRepository extends MongoRepository<TokenBlacklist, String> {

    /** Kiểm tra refresh token (theo hash) có bị blacklist không */
    boolean existsByTokenHash(String tokenHash);
}
