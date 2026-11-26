package com.example.tpoDA.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private final Key key;
    private final long expiration;

    public JwtService(
            @Value("${application.security.jwt.secretKey}") String secret,
            @Value("${application.security.jwt.expiration}") long expiration
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    // =========================
    // GENERAR TOKEN
    // =========================

    public String generateToken(String email) {

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())

                .setExpiration(
                        new Date(System.currentTimeMillis() + expiration)
                )

                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================
    // EXTRAER EMAIL
    // =========================

    public String extractUsername(String token) {

        return extractAllClaims(token)
                .getSubject();
    }

    private Claims extractAllClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
