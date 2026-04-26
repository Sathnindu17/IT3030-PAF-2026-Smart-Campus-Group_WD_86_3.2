package com.smartcampus.modules.resources.controller;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.modules.resources.dto.ResourceRecommendationResponse;
import com.smartcampus.modules.resources.dto.ResourceRequest;
import com.smartcampus.modules.resources.dto.ResourceResponse;
import com.smartcampus.modules.resources.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping
    public ResponseEntity<ApiResponse<ResourceResponse>> create(@Valid @RequestBody ResourceRequest request) {
        ResourceResponse response = resourceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Resource created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> update(@PathVariable String id,
                                                                 @Valid @RequestBody ResourceRequest request) {
        ResourceResponse response = resourceService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Resource updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        resourceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted", null));
    }

    @GetMapping("/{id:^(?!recommendations$).+}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getById(@PathVariable String id) {
        ResourceResponse response = resourceService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) {
        List<ResourceResponse> response = resourceService.getAll(type, status, location, minCapacity);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<ResourceRecommendationResponse>>> recommend(
            @RequestParam Integer attendees,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String equipment,
            @RequestParam(required = false) String preferredLocation,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        List<ResourceRecommendationResponse> response = resourceService.recommend(
                attendees,
                type,
                equipment,
                preferredLocation,
                date,
                startTime,
                endTime
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
