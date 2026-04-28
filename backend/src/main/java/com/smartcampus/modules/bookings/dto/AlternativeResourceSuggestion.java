package com.smartcampus.modules.bookings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlternativeResourceSuggestion {
    private String resourceId;
    private String resourceName;
    private String resourceType;
    private String location;
    private int capacity;
}
