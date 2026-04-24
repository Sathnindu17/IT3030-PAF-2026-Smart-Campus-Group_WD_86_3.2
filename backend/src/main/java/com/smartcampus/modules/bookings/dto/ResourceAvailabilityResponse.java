package com.smartcampus.modules.bookings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAvailabilityResponse {
    private String resourceId;
    private String status;
    private String availableAfter;
}
