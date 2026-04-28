package com.smartcampus.modules.upload;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.common.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"
    );

    @PostMapping
    public ResponseEntity<ApiResponse<List<String>>> uploadFiles(
            @RequestParam("files") MultipartFile[] files) throws IOException {

        if (files.length > 3) {
            throw new BadRequestException("Maximum 3 files allowed");
        }

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            // Validate file type
            if (!isAllowedImage(file)) {
                throw new BadRequestException("Only image files (JPEG, PNG, GIF, WebP) are allowed");
            }

            // Validate file size (5MB max)
            if (file.getSize() > 5 * 1024 * 1024) {
                throw new BadRequestException("File size must be less than 5MB");
            }

            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            urls.add("/uploads/" + filename);
        }

        return ResponseEntity.ok(ApiResponse.success("Files uploaded", urls));
    }

    private boolean isAllowedImage(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && ALLOWED_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            return true;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }

        String lowerName = originalFilename.toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.stream().anyMatch(lowerName::endsWith);
    }
}
