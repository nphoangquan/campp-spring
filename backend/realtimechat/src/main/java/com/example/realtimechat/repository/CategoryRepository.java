package com.example.realtimechat.repository;

import com.example.realtimechat.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
//Truy vấn collections categories
public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByServerIdOrderByPositionAsc(String serverId);
    Optional<Category> findByIdAndServerId(String id, String serverId);
    long deleteByServerId(String serverId);
}