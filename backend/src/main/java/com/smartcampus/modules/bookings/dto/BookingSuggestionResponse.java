package com.smartcampus.modules.bookings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSuggestionResponse {
    private boolean hasConflict;
    private String message;
    private String requestedResourceId;
    private String requestedResourceName;
    private String nextAvailableStartTime;
    private String suggestedEndTime;
    private List<AlternativeResourceSuggestion> alternatives;
}
