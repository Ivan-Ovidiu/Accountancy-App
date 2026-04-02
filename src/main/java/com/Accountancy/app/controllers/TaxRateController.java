package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.TaxRateDTO.TaxRateRequest;
import com.Accountancy.app.dto.TaxRateDTO.TaxRateResponse;
import com.Accountancy.app.services.TaxRateService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tax-rates")
@SecurityRequirement(name = "bearerAuth")
public class TaxRateController {

    private final TaxRateService taxRateService;

    public TaxRateController(TaxRateService taxRateService) {
        this.taxRateService = taxRateService;
    }

    // GET /api/tax-rates
    @GetMapping
    public ResponseEntity<List<TaxRateResponse>> getAllTaxRates() {
        return ResponseEntity.ok(taxRateService.getAllTaxRates());
    }

    // GET /api/tax-rates/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TaxRateResponse> getTaxRateById(@PathVariable Integer id) {
        return ResponseEntity.ok(taxRateService.getTaxRateById(id));
    }

    // POST /api/tax-rates
    @PostMapping
    public ResponseEntity<TaxRateResponse> createTaxRate(@RequestBody TaxRateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taxRateService.createTaxRate(request));
    }

    // PUT /api/tax-rates/{id}
    @PutMapping("/{id}")
    public ResponseEntity<TaxRateResponse> updateTaxRate(@PathVariable Integer id,
                                                         @RequestBody TaxRateRequest request) {
        return ResponseEntity.ok(taxRateService.updateTaxRate(id, request));
    }

    // DELETE /api/tax-rates/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateTaxRate(@PathVariable Integer id) {
        taxRateService.deactivateTaxRate(id);
        return ResponseEntity.noContent().build();
    }
}