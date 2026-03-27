package com.example.realtimechat.repository;

import com.example.realtimechat.model.ServerMember;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

//Truy vấn collection server_member
public interface ServerMemberRepository extends MongoRepository<ServerMember, String> {
    Optional<ServerMember> findByServerIdAndUserId(String serverId, String userId);

    List<ServerMember> findByUserId(String userId);

    List<ServerMember> findByServerId(String serverId);

    long deleteByServerIdAndUserId(String serverId, String userId);

    long deleteByServerId(String serverId);
}