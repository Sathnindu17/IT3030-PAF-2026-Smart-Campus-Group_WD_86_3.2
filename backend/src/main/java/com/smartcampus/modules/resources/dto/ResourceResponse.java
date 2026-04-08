package com.smartcampus.modules.resources.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {
    private String id;
    private String name;
    private String type;
    private int capacity;
    private String location;
    private String status;
    private String description;
}
