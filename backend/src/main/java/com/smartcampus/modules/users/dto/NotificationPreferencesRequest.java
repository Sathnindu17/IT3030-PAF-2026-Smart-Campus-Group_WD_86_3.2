package com.smartcampus.modules.users.dto;

import lombok.Data;

import java.util.List;

@Data
public class NotificationPreferencesRequest {
    private List<String> enabledTypes;
    private boolean dndEnabled;
    private String dndStart;
    private String dndEnd;
}
