package com.smartcampus.modules.resources.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceMapAvailabilityResponse {
    private String resourceId;
    private boolean available;
}
