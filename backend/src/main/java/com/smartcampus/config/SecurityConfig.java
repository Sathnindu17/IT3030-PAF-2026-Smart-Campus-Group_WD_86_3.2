package com.smartcampus.config;

import com.smartcampus.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/hello").permitAll()

                // Resource management - create/read/update/delete public
                .requestMatchers(HttpMethod.POST, "/api/resources").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/resources/**").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()

                // Bookings
                .requestMatchers(HttpMethod.POST, "/api/bookings").authenticated()
                .requestMatchers("/api/bookings/my").authenticated()
                .requestMatchers("/api/bookings/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/bookings/*/approve").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/bookings/*/reject").hasRole("ADMIN")

                // Tickets
                .requestMatchers(HttpMethod.POST, "/api/tickets").authenticated()
                .requestMatchers("/api/tickets/my").authenticated()
                .requestMatchers("/api/tickets/assigned").hasAnyRole("TECHNICIAN", "ADMIN")
                .requestMatchers("/api/tickets/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/tickets/*/assign").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/tickets/*/status").hasAnyRole("ADMIN", "TECHNICIAN")
                .requestMatchers(HttpMethod.PATCH, "/api/tickets/*/resolve").hasAnyRole("ADMIN", "TECHNICIAN")

                // Comments
                .requestMatchers("/api/comments/**").authenticated()

                // Notifications
                .requestMatchers("/api/notifications/**").authenticated()

                // File upload
                .requestMatchers("/api/upload/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
