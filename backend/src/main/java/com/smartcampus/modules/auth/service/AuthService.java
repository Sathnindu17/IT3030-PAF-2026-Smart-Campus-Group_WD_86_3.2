package com.smartcampus.modules.auth.service;

import com.smartcampus.common.exception.BadRequestException;
import com.smartcampus.common.exception.ConflictException;
import com.smartcampus.common.exception.UnauthorizedException;
import com.smartcampus.modules.auth.dto.AuthResponse;
import com.smartcampus.modules.auth.dto.GoogleLoginRequest;
import com.smartcampus.modules.auth.dto.LoginRequest;
import com.smartcampus.modules.auth.dto.RegisterRequest;
import com.smartcampus.modules.notifications.service.NotificationService;
import com.smartcampus.modules.users.dto.NotificationPreferencesRequest;
import com.smartcampus.modules.users.dto.UserResponse;
import com.smartcampus.modules.users.entity.User;
import com.smartcampus.modules.users.repository.UserRepository;
import com.smartcampus.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    private static final List<String> DEFAULT_ENABLED_TYPES = Arrays.asList("SECURITY", "BOOKING", "TICKET", "SYSTEM", "GENERAL");

    public AuthResponse register(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        // Parse role
        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role. Allowed: USER, ADMIN, TECHNICIAN");
        }

        // Create user
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .authProvider(User.AuthProvider.LOCAL)
                .notificationPreferences(User.NotificationPreferences.builder()
                        .enabledTypes(DEFAULT_ENABLED_TYPES)
                        .dndEnabled(false)
                        .dndStart("22:00")
                        .dndEnd("07:00")
                        .build())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            throw new BadRequestException("This account uses Google sign-in. Please use Google to log in.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    public AuthResponse googleLogin(GoogleLoginRequest request) {
        try {
            String credential = request.getCredential();
            String email = null;
            String name = null;

            // Try using the credential as an access token first (implicit flow)
            try {
                java.net.URL url = new java.net.URL("https://www.googleapis.com/oauth2/v3/userinfo");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestProperty("Authorization", "Bearer " + credential);
                conn.setRequestMethod("GET");

                if (conn.getResponseCode() == 200) {
                    java.io.InputStream is = conn.getInputStream();
                    String body = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                    is.close();

                    // Simple JSON parsing for email and name
                    email = extractJsonField(body, "email");
                    name = extractJsonField(body, "name");
                }
            } catch (Exception e) {
                // Fall through to ID token verification
            }

            // Fallback: try verifying as an ID token
            if (email == null) {
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();

                GoogleIdToken idToken = verifier.verify(credential);
                if (idToken == null) {
                    throw new UnauthorizedException("Invalid Google token");
                }

                GoogleIdToken.Payload payload = idToken.getPayload();
                email = payload.getEmail();
                name = (String) payload.get("name");
            }

            if (email == null) {
                throw new UnauthorizedException("Could not retrieve email from Google");
            }

            // Check if user exists
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
            } else {
                // Create new user with default USER role
                user = User.builder()
                        .fullName(name != null ? name : email)
                        .email(email)
                        .role(User.Role.USER)
                        .authProvider(User.AuthProvider.GOOGLE)
                        .notificationPreferences(User.NotificationPreferences.builder()
                                .enabledTypes(DEFAULT_ENABLED_TYPES)
                                .dndEnabled(false)
                                .dndStart("22:00")
                                .dndEnd("07:00")
                                .build())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                user = userRepository.save(user);
            }

            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            return AuthResponse.builder()
                    .token(token)
                    .user(toUserResponse(user))
                    .build();

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Google authentication failed: " + e.getMessage());
        }
    }

    private String extractJsonField(String json, String field) {
        // Simple extraction: "field":"value" or "field": "value"
        String pattern = "\"" + field + "\"\\s*:\\s*\"";
        int idx = json.indexOf("\"" + field + "\"");
        if (idx == -1) return null;
        int colonIdx = json.indexOf(":", idx);
        if (colonIdx == -1) return null;
        int quoteStart = json.indexOf("\"", colonIdx + 1);
        if (quoteStart == -1) return null;
        int quoteEnd = json.indexOf("\"", quoteStart + 1);
        if (quoteEnd == -1) return null;
        return json.substring(quoteStart + 1, quoteEnd);
    }

    // ===== Trusted Device Alert =====

    public void sendDeviceAlert(String userId, String deviceInfo) {
        String title = "🔐 New Sign-in Detected";
        String message = "New sign-in detected from " + deviceInfo + ". Not you? Secure your account immediately.";
        notificationService.create(userId, title, message, "SECURITY");
    }

    // ===== Notification Preferences =====

    public User.NotificationPreferences getNotificationPreferences(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getNotificationPreferences() == null) {
            // Return defaults
            return User.NotificationPreferences.builder()
                    .enabledTypes(DEFAULT_ENABLED_TYPES)
                    .dndEnabled(false)
                    .dndStart("22:00")
                    .dndEnd("07:00")
                    .build();
        }
        return user.getNotificationPreferences();
    }

    public User.NotificationPreferences updateNotificationPreferences(String userId,
                                                                       NotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        User.NotificationPreferences prefs = User.NotificationPreferences.builder()
                .enabledTypes(request.getEnabledTypes() != null ? request.getEnabledTypes() : DEFAULT_ENABLED_TYPES)
                .dndEnabled(request.isDndEnabled())
                .dndStart(request.getDndStart() != null ? request.getDndStart() : "22:00")
                .dndEnd(request.getDndEnd() != null ? request.getDndEnd() : "07:00")
                .build();

        user.setNotificationPreferences(prefs);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return prefs;
    }

    public UserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .authProvider(user.getAuthProvider().name())
                .build();
    }
}
