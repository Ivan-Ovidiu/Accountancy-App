package com.Accountancy.app.dto;

import com.Accountancy.app.dto.CompanyDTO.CompanySummary;
import jakarta.validation.constraints.*;

import java.util.List;

public class AuthDTO {

    // ============================================================
    // Login flow (step 1: credentials)
    // ============================================================

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    /**
     * Response from /api/auth/login. Always carries a pre-auth token; the
     * frontend uses {@code companies} to render the picker (or auto-select
     * if only one is available).
     */
    public record LoginResponse(
            String preAuthToken,
            String email,
            String name,
            String role,
            List<CompanySummary> companies
    ) {}

    // ============================================================
    // Login flow (step 2: company selection)
    // ============================================================

    public record SelectCompanyRequest(
            @NotNull(message = "Company ID is required")
            Integer companyId
    ) {}

    /** Response from /api/auth/select-company — the final usable token. */
    public record SelectCompanyResponse(
            String token,
            String email,
            String name,
            String role,
            Integer companyId,
            String companyName,
            String companyCode
    ) {}

    // ============================================================
    // Currently-authenticated user info
    // ============================================================

    public record MeResponse(
            String email,
            String name,
            String role,
            Integer companyId,      // null if pre-auth
            String companyName,     // null if pre-auth
            String companyCode      // null if pre-auth
    ) {}
}