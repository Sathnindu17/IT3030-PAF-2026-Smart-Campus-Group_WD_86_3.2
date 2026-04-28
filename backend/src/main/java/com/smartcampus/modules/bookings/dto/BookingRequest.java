package com.smartcampus.modules.bookings.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {

    // Existing resource (dropdown)
    private String resourceId;

    // Custom resource (user input)
    private String resourceName;

    @NotBlank(message = "Date is required")
    private String date;

    @NotBlank(message = "Start time is required")
    private String startTime;

    @NotBlank(message = "End time is required")
    private String endTime;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    @NotNull(message = "Expected attendees is required")
    @Min(value = 1, message = "Expected attendees must be at least 1")
    private Integer expectedAttendees;

    // 🔥 IMPORTANT: Custom validation
    public boolean isValidResource() {
        return (resourceId != null && !resourceId.isBlank())
                || (resourceName != null && !resourceName.isBlank());
    }
}