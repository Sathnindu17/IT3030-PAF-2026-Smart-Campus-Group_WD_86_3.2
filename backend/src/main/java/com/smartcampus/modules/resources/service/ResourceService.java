package com.smartcampus.modules.resources.service;

import com.smartcampus.common.exception.BadRequestException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.modules.resources.dto.ResourceRequest;
import com.smartcampus.modules.resources.dto.ResourceResponse;
import com.smartcampus.modules.resources.entity.Resource;
import com.smartcampus.modules.resources.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceResponse create(ResourceRequest request) {
        Resource resource = Resource.builder()
                .name(request.getName())
                .type(parseType(request.getType()))
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .status(parseStatus(request.getStatus()))
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        resource = resourceRepository.save(resource);
        return toResponse(resource);
    }

    public ResourceResponse update(String id, ResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));

        resource.setName(request.getName());
        resource.setType(parseType(request.getType()));
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setStatus(parseStatus(request.getStatus()));
        resource.setDescription(request.getDescription());
        resource.setUpdatedAt(LocalDateTime.now());

        resource = resourceRepository.save(resource);
        return toResponse(resource);
    }

    public void delete(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    public ResourceResponse getById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return toResponse(resource);
    }

    public List<ResourceResponse> getAll(String type, String status, String location, Integer minCapacity) {
        List<Resource> resources;

        if (type != null && status != null) {
            resources = resourceRepository.findByTypeAndStatus(parseType(type), parseStatus(status));
        } else if (type != null) {
            resources = resourceRepository.findByType(parseType(type));
        } else if (status != null) {
            resources = resourceRepository.findByStatus(parseStatus(status));
        } else if (location != null) {
            resources = resourceRepository.findByLocation(location);
        } else if (minCapacity != null) {
            resources = resourceRepository.findByCapacityGreaterThanEqual(minCapacity);
        } else {
            resources = resourceRepository.findAll();
        }

        return resources.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private Resource.ResourceType parseType(String type) {
        try {
            return Resource.ResourceType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid type: " + type + ". Allowed: LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT");
        }
    }

    private Resource.ResourceStatus parseStatus(String status) {
        try {
            return Resource.ResourceStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status + ". Allowed: ACTIVE, OUT_OF_SERVICE");
        }
    }

    private ResourceResponse toResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType().name())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus().name())
                .description(resource.getDescription())
                .build();
    }
}
