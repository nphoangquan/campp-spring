package com.example.realtimechat.repository;

import com.example.realtimechat.model.Channel;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
//Truy vấn collections channels
public interface ChannelRepository extends MongoRepository<Channel, String> {
    List<Channel> findByServerIdOrderByPositionAsc(String serverId);
    List<Channel> findByServerIdAndCategoryIdOrderByPositionAsc(String serverId, String categoryId);
    Optional<Channel> findByIdAndServerId(String id, String serverId);
    long deleteByServerId(String serverId);
}