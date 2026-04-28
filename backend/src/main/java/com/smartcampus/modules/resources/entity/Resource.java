package com.smartcampus.modules.resources.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    private String name;
    private ResourceType type;
    private int capacity;
    private String location;
    private ResourceStatus status;
    private String description;
    private List<String> equipment;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum ResourceType {
        LECTURE_HALL, LAB, MEETING_ROOM, EXAM_HALL, AUDITORIUM
    }

    public enum ResourceStatus {
        ACTIVE, UNDER_RENOVATION, OUT_OF_SERVICE
    }
}
