package com.smartcampus.modules.bookings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private String id;
    private String resourceId;
    private String resourceName;
    private String userId;
    private String userName;
    private String date;
    private String startTime;
    private String endTime;
    private String purpose;
    private int expectedAttendees;
    private String status;
    private String rejectionReason;
    private String createdAt;
}
