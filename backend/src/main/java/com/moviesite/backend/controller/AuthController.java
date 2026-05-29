package com.moviesite.backend.controller;

import com.moviesite.backend.dto.AuthDtos;
import com.moviesite.backend.model.UserEntity;
import com.moviesite.backend.repository.UserRepository;
import com.moviesite.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class AuthController {
    private static final String ADMIN_EMAIL = "admin@cine.com";
    private static final String ADMIN_PASSWORD = "Seelan@25";
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/users/add")
    public ResponseEntity<?> register(@RequestBody AuthDtos.RegisterRequest req) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase(Locale.ROOT);
        if (email.isBlank() || req.password() == null || req.password().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid registration payload."));
        }
        if (ADMIN_EMAIL.equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "This email is reserved for admin login."));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already exists."));
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setFullName(req.customerName() == null ? "" : req.customerName().trim());
        user.setPhone(req.phone() == null ? "" : req.phone().trim());
        user.setRole("ROLE_CUSTOMER");
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody AuthDtos.LoginRequest req) {
        if (req == null || req.password() == null || req.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }
        String email = req.email() == null ? "" : req.email().trim().toLowerCase(Locale.ROOT);
        if (ADMIN_EMAIL.equals(email) && ADMIN_PASSWORD.equals(req.password())) {
            List<String> roles = List.of("ROLE_ADMIN");
            String token = jwtService.generate(ADMIN_EMAIL, roles);
            return ResponseEntity.ok(new AuthDtos.LoginResponse(
                    "ADMIN-STATIC",
                    ADMIN_EMAIL,
                    "CineVision Admin",
                    "",
                    roles,
                    token
            ));
        }
        return userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(req.password(), u.getPassword()))
                .<ResponseEntity<?>>map(u -> {
                    String role = (u.getRole() == null || u.getRole().isBlank()) ? "ROLE_CUSTOMER" : u.getRole();
                    List<String> roles = List.of(role);
                    String token = jwtService.generate(u.getEmail(), roles);
                    return ResponseEntity.ok(new AuthDtos.LoginResponse(
                            u.getUserId(),
                            u.getEmail(),
                            u.getFullName(),
                            u.getPhone(),
                            roles,
                            token
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid email or password.")));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<?> listUsersForAdmin(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (!jwtService.hasRole(authorization, "ROLE_ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        List<Map<String, String>> users = userRepository.findAll().stream()
                .sorted(Comparator.comparing(UserEntity::getFullName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> Map.of(
                        "userId", u.getUserId() == null ? "" : u.getUserId(),
                        "fullName", u.getFullName() == null ? "" : u.getFullName(),
                        "email", u.getEmail() == null ? "" : u.getEmail(),
                        "phone", u.getPhone() == null ? "" : u.getPhone(),
                        "role", u.getRole() == null ? "ROLE_CUSTOMER" : u.getRole()
                ))
                .toList();
        return ResponseEntity.ok(users);
    }
}
