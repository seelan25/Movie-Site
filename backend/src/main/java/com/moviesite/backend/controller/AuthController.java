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

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/users/add")
    public ResponseEntity<?> register(@RequestBody AuthDtos.RegisterRequest req) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase(Locale.ROOT);
        if (email.isBlank() || req.password() == null || req.password().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid registration payload."));
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
        String email = req.email() == null ? "" : req.email().trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(req.password(), u.getPassword()))
                .<ResponseEntity<?>>map(u -> {
                    List<String> roles = List.of(u.getRole());
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
}
