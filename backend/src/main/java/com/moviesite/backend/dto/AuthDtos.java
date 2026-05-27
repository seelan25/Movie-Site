package com.moviesite.backend.dto;

import java.util.List;

public class AuthDtos {
    public record RegisterRequest(String customerName, String email, String phone, String password) {}
    public record LoginRequest(String email, String password) {}
    public record LoginResponse(String userId, String email, String fullName, String phone, List<String> roles, String token) {}
}
