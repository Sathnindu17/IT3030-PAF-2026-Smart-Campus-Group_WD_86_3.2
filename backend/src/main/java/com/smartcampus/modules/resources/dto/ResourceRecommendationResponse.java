package com.smartcampus.modules.resources.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRecommendationResponse {
    private String resourceId;
    private String resourceName;
    private String resourceType;
    private int capacity;
    private String location;
    private List<String> equipment;
    private int score;
    private String reason;
}
