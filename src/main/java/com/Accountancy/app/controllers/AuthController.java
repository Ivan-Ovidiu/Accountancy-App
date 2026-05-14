package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.AuthDTO.*;
import com.Accountancy.app.dto.CompanyDTO.CompanySummary;
import com.Accountancy.app.entities.Company;
import com.Accountancy.app.entities.User;
import com.Accountancy.app.entities.UserCompany;
import com.Accountancy.app.repositories.CompanyRepository;
import com.Accountancy.app.repositories.UserCompanyRepository;
import com.Accountancy.app.repositories.UserRepository;
import com.Accountancy.app.security.CompanyContext;
import com.Accountancy.app.security.JwtUtil;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@SecurityRequirement(name = "bearerAuth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final CompanyRepository companyRepository;
    private final CompanyContext companyContext;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          UserCompanyRepository userCompanyRepository,
                          CompanyRepository companyRepository,
                          CompanyContext companyContext,
                          JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.companyRepository = companyRepository;
        this.companyContext = companyContext;
        this.jwtUtil = jwtUtil;
    }

    // ============================================================
    // STEP 1 — Email/password authentication
    // Returns a pre-auth token + list of accessible companies.
    // ============================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        try {
            User user = userRepository.findByEmail(request.email()).orElseThrow();
            String preAuthToken = jwtUtil.generatePreAuthToken(user.getEmail(), user.getRole().name());
            List<CompanySummary> companies = listAccessibleCompanies(user.getId());
            System.out.println("=== companies: " + companies.size());
            return ResponseEntity.ok(new LoginResponse(
                    preAuthToken, user.getEmail(), user.getName(), user.getRole().name(), companies
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // ============================================================
    // STEP 2 — Pick a company; receive the final token.
    // Requires a valid pre-auth token in the Authorization header.
    // ============================================================
    @PostMapping("/select-company")
    public ResponseEntity<?> selectCompany(
            @Valid @RequestBody SelectCompanyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Company company = companyRepository.findById(request.companyId())
                .orElseThrow(() -> new RuntimeException("Company not found: " + request.companyId()));

        // ADMIN are acces la orice companie activă
        if (user.getRole() != User.Role.ADMIN) {
            userCompanyRepository.findByUserIdAndCompany_Id(user.getId(), request.companyId())
                    .orElseThrow(() -> new RuntimeException(
                            "You don't have access to company " + request.companyId()));
        }

        if (!Boolean.TRUE.equals(company.getIsActive())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Selected company is inactive");
        }

        String finalToken = jwtUtil.generateToken(
                user.getEmail(), user.getRole().name(), company.getId());

        return ResponseEntity.ok(new SelectCompanyResponse(
                finalToken, user.getEmail(), user.getName(), user.getRole().name(),
                company.getId(), company.getName(), company.getCode()));
    }
    // ============================================================
    // Convenience — switch company without re-entering credentials.
    // Requires a valid FINAL token (not pre-auth).
    // Issues a new final token for the requested company.
    // ============================================================
    @PostMapping("/switch-company")
    public ResponseEntity<?> switchCompany(
            @Valid @RequestBody SelectCompanyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Same logic as select-company; we just expose it as a separate
        // endpoint to make the frontend's intent clearer.
        return selectCompany(request, userDetails);
    }

    // ============================================================
    // Currently-authenticated user info, including company context.
    // ============================================================
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Integer companyId = companyContext.getCurrentCompanyId();
        String  companyName = null;
        String  companyCode = null;

        if (companyId != null) {
            Company c = companyRepository.findById(companyId).orElse(null);
            if (c != null) {
                companyName = c.getName();
                companyCode = c.getCode();
            }
        }

        return ResponseEntity.ok(new MeResponse(
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                companyId,
                companyName,
                companyCode
        ));
    }

    // ============================================================
    // Helpers
    // ============================================================

    private List<CompanySummary> listAccessibleCompanies(Integer userId) {
        User user = userRepository.findById(userId).orElseThrow();

        if (user.getRole() == User.Role.ADMIN) {
            return companyRepository.findByIsActiveTrueOrderByCodeAsc()
                    .stream()
                    .map(c -> new CompanySummary(c.getId(), c.getCode(), c.getName(), c.getTaxId(), false))
                    .toList();
        }

        return userCompanyRepository.findAccessibleByUserId(userId)
                .stream()
                .map(uc -> new CompanySummary(
                        uc.getCompany().getId(), uc.getCompany().getCode(),
                        uc.getCompany().getName(), uc.getCompany().getTaxId(),
                        uc.getIsDefault()))
                .toList();
    }
}