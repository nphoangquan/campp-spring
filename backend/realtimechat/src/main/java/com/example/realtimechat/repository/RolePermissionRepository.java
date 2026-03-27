package com.example.realtimechat.repository;

import com.example.realtimechat.model.RolePermissionOverride;
import com.example.realtimechat.model.ServerMemberRole;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RolePermissionRepository extends MongoRepository<RolePermissionOverride, String> {

    Optional<RolePermissionOverride> findByServerIdAndRole(String serverId, ServerMemberRole role);

    List<RolePermissionOverride> findByServerId(String serverId);

    void deleteByServerId(String serverId);
}
