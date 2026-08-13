package com.eventflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class JwtTokenProvider {

    private final RedisTemplate<String, String> redisTemplate;
    private final String jwtSecret;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            RedisTemplate<String, String> redisTemplate,
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-ms}") long accessExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs
    ) {
        this.redisTemplate = redisTemplate;
        this.jwtSecret = jwtSecret;
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(UserPrincipal principal) {
        return generateToken(principal, accessExpirationMs);
    }

    public String generateRefreshToken(UserPrincipal principal) {
        String refreshToken = generateToken(principal, refreshExpirationMs);
        redisTemplate.opsForValue().set(
                refreshKey(principal.id()),
                sha256(refreshToken),
                refreshExpirationMs,
                TimeUnit.MILLISECONDS
        );
        return refreshToken;
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(validateToken(token).getSubject());
    }

    public boolean isRefreshTokenValid(String refreshToken) {
        UUID userId = getUserIdFromToken(refreshToken);
        String storedHash = redisTemplate.opsForValue().get(refreshKey(userId));
        return storedHash != null && MessageDigest.isEqual(storedHash.getBytes(StandardCharsets.UTF_8), sha256(refreshToken).getBytes(StandardCharsets.UTF_8));
    }

    public void revokeRefreshToken(UUID userId) {
        redisTemplate.delete(refreshKey(userId));
    }

    public long accessExpirationSeconds() {
        return Duration.ofMillis(accessExpirationMs).toSeconds();
    }

    private String generateToken(UserPrincipal principal, long expirationMs) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.id().toString())
                .claim("email", principal.email())
                .claim("role", principal.role().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey())
                .compact();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private String refreshKey(UUID userId) {
        return "refresh:" + userId;
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
