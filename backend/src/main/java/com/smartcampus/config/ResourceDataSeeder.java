package com.smartcampus.config;

import com.smartcampus.modules.resources.entity.Resource;
import com.smartcampus.modules.resources.repository.ResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class ResourceDataSeeder {

    @Bean
    CommandLineRunner seedResources(ResourceRepository resourceRepository) {
        return args -> {
            if (resourceRepository.count() > 0) {
                return;
            }

            LocalDateTime now = LocalDateTime.now();

            Resource lectureHall = Resource.builder()
                    .name("Lecture hall")
                    .type(Resource.ResourceType.LECTURE_HALL)
                    .capacity(35)
                    .location("G block")
                    .status(Resource.ResourceStatus.ACTIVE)
                    .description(null)
                    .equipment(List.of("smart board"))
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            Resource mainHall = Resource.builder()
                    .name("Main hall")
                    .type(Resource.ResourceType.LECTURE_HALL)
                    .capacity(1)
                    .location("F block")
                    .status(Resource.ResourceStatus.ACTIVE)
                    .description("ghhfhfhfhfhj")
                    .equipment(List.of())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            Resource labHalle2 = Resource.builder()
                    .name("Lab halle 2")
                    .type(Resource.ResourceType.LAB)
                    .capacity(30)
                    .location("Main Building")
                    .status(Resource.ResourceStatus.ACTIVE)
                    .description(null)
                    .equipment(List.of("30 Pc"))
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            Resource lectureHall01 = Resource.builder()
                    .name("Lecture hall 01")
                    .type(Resource.ResourceType.LAB)
                    .capacity(20)
                    .location("G block")
                    .status(Resource.ResourceStatus.ACTIVE)
                    .description(null)
                    .equipment(List.of("smart board"))
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            resourceRepository.saveAll(List.of(lectureHall, mainHall, labHalle2, lectureHall01));
        };
    }
}
