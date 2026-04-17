package com.smartcampus.modules.auth.controller;

import com.smartcampus.common.dto.ApiResponse;
import com.smartcampus.modules.auth.dto.AuthResponse;
import com.smartcampus.modules.auth.dto.GoogleLoginRequest;
import com.smartcampus.modules.auth.dto.LoginRequest;
import com.smartcampus.modules.auth.dto.RegisterRequest;
import com.smartcampus.modules.auth.service.AuthService;
import com.smartcampus.modules.users.dto.NotificationPreferencesRequest;
import com.smartcampus.modules.users.dto.UserResponse;
import com.smartcampus.modules.users.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Device Alert (Trusted Device Feature) =====

    @PostMapping("/device-alert")
    public ResponseEntity<ApiResponse<Void>> sendDeviceAlert(@RequestBody Map<String, String> body,
                                                              Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String deviceInfo = body.getOrDefault("deviceInfo", "Unknown device");
        authService.sendDeviceAlert(userId, deviceInfo);
        return ResponseEntity.ok(ApiResponse.success("Device alert sent", null));
    }

    // ===== Notification Preferences =====

    @GetMapping("/notification-preferences")
    public ResponseEntity<ApiResponse<User.NotificationPreferences>> getNotificationPreferences(
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        User.NotificationPreferences prefs = authService.getNotificationPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success(prefs));
    }

    @PutMapping("/notification-preferences")
    public ResponseEntity<ApiResponse<User.NotificationPreferences>> updateNotificationPreferences(
            @RequestBody NotificationPreferencesRequest request,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        User.NotificationPreferences prefs = authService.updateNotificationPreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated", prefs));
    }
}
