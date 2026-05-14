package com.Accountancy.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues two kinds of tokens:
 *
 *   1) Pre-auth token  — short-lived (5 min), proves the user authenticated
 *                        but hasn't picked a company yet. Carries no companyId.
 *                        Marked with claim "preAuth": true.
 *
 *   2) Final token     — long-lived (configured via app.jwt.expiration-ms),
 *                        carries the selected companyId. Used for all
 *                        protected endpoints once a company is chosen.
 */
@Component
public class JwtUtil {

    /** Pre-auth tokens are short-lived; user must pick a company quickly. */
    private static final long PRE_AUTH_EXPIRATION_MS = 5 * 60 * 1000L;  // 5 minutes

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ============================================================
    // PRE-AUTH TOKEN — issued at /api/auth/login or after OAuth2,
    // before the user picks a company.
    // ============================================================
    public String generatePreAuthToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("preAuth", true)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + PRE_AUTH_EXPIRATION_MS))
                .signWith(getSigningKey())
                .compact();
    }

    // ============================================================
    // FINAL TOKEN — issued at /api/auth/select-company once the
    // user has chosen which company to operate on.
    // ============================================================
    public String generateToken(String email, String role, Integer companyId) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("companyId", companyId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Backward-compat overload. Existing call sites that don't yet know about
     * companies will still compile — but the produced token will be treated
     * as a pre-auth token by the filter (no companyId set).
     */
    public String generateToken(String email, String role) {
        return generatePreAuthToken(email, role);
    }

    // ============================================================
    // EXTRACTORS
    // ============================================================
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /** Returns the companyId claim, or null if this is a pre-auth token. */
    public Integer extractCompanyId(String token) {
        Object raw = parseClaims(token).get("companyId");
        if (raw == null) return null;
        if (raw instanceof Integer i) return i;
        if (raw instanceof Number n) return n.intValue();
        return null;
    }

    /** True if the token has the preAuth flag — i.e., no company selected yet. */
    public boolean isPreAuthToken(String token) {
        Boolean flag = parseClaims(token).get("preAuth", Boolean.class);
        return Boolean.TRUE.equals(flag);
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}