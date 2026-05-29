package com.moviesite.backend.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-minutes}")
    private long expirationMinutes;

    public String generate(String email, List<String> roles) {
        long now = System.currentTimeMillis();
        byte[] secretBytes = normalizedSecret();
        return Jwts.builder()
                .setSubject(email)
                .claim("authorities", roles.stream().map(r -> java.util.Map.of("authority", r)).toList())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + (expirationMinutes * 60_000)))
                .signWith(Keys.hmacShaKeyFor(secretBytes), SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean hasRole(String token, String role) {
        if (token == null || token.isBlank() || role == null || role.isBlank()) return false;
        String clean = token.trim().startsWith("Bearer ") ? token.trim().substring(7) : token.trim();
        try {
            Object rawAuthorities = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(normalizedSecret()))
                    .build()
                    .parseClaimsJws(clean)
                    .getBody()
                    .get("authorities");
            if (!(rawAuthorities instanceof List<?> list)) return false;
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    Object authority = m.get("authority");
                    if (role.equals(authority)) return true;
                } else if (role.equals(String.valueOf(item))) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] normalizedSecret() {
        byte[] secretBytes = jwtSecret == null ? new byte[0] : jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 64) {
            secretBytes = sha512(secretBytes);
        }
        return secretBytes;
    }

    private byte[] sha512(byte[] input) {
        try {
            return MessageDigest.getInstance("SHA-512").digest(input);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-512 not available on this runtime.", e);
        }
    }
}
