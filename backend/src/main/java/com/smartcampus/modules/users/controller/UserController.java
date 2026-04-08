package com.smartcampus.modules.users.controller;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.modules.users.dto.UserResponse;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/technicians")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getTechnicians() {
        List<UserResponse> technicians = userRepository.findByRole(User.Role.TECHNICIAN).stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .authProvider(u.getAuthProvider().name())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(technicians));
    }
}
