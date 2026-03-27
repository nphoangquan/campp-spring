package com.example.realtimechat.repository;

import com.example.realtimechat.model.Server;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

//Truy vấn collection server
public interface ServerRepository extends MongoRepository<Server, String> {
    List<Server> findByOwnerId(String ownerId);

    Optional<Server> findByInviteCode(String inviteCode);

    // Batch fetch nhiều server cùng lúc – tránh N+1 query
    List<Server> findByIdIn(List<String> ids);
}
