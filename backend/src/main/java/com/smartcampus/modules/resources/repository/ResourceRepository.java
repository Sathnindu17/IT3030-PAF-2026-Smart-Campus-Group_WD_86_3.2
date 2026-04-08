package com.smartcampus.modules.resources.repository;

import com.smartcampus.modules.resources.entity.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ResourceRepository extends MongoRepository<Resource, String> {
    List<Resource> findByType(Resource.ResourceType type);
    List<Resource> findByStatus(Resource.ResourceStatus status);
    List<Resource> findByLocation(String location);
    List<Resource> findByCapacityGreaterThanEqual(int capacity);
    List<Resource> findByTypeAndStatus(Resource.ResourceType type, Resource.ResourceStatus status);
}
