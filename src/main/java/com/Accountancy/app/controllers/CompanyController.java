package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.CompanyDTO.*;
import com.Accountancy.app.services.CompanyService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@SecurityRequirement(name = "bearerAuth")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<CompanySummary>> getMyCompanies() {
        return ResponseEntity.ok(companyService.getMyCompanies());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CompanyResponse>> searchCompanies(@RequestParam String name) {
        return ResponseEntity.ok(companyService.searchCompanies(name));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CompanyResponse> getCompanyById(@PathVariable Integer id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CompanyResponse> createCompany(@Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.createCompany(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CompanyResponse> updateCompany(@PathVariable Integer id,
                                                         @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.updateCompany(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCompany(@PathVariable Integer id) {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/access")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> grantAccess(@Valid @RequestBody CompanyAccessRequest request) {
        companyService.grantAccess(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{companyId}/access/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> revokeAccess(@PathVariable Integer companyId,
                                             @PathVariable Integer userId) {
        companyService.revokeAccess(userId, companyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/access")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserCompanyResponse>> getCompanyAccess(@PathVariable Integer id) {
        return ResponseEntity.ok(companyService.getCompanyAccess(id));
    }
}