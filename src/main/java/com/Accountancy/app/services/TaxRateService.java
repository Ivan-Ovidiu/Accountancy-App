package com.Accountancy.app.services;

import com.Accountancy.app.dto.TaxRateDTO.TaxRateRequest;
import com.Accountancy.app.dto.TaxRateDTO.TaxRateResponse;
import com.Accountancy.app.entities.Company;
import com.Accountancy.app.entities.TaxRate;
import com.Accountancy.app.repositories.CompanyRepository;
import com.Accountancy.app.repositories.TaxRateRepository;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaxRateService {

    private final TaxRateRepository taxRateRepository;
    private final CompanyRepository companyRepository;
    private final CompanyContext companyContext;

    public TaxRateService(TaxRateRepository taxRateRepository,
                          CompanyRepository companyRepository,
                          CompanyContext companyContext) {
        this.taxRateRepository = taxRateRepository;
        this.companyRepository = companyRepository;
        this.companyContext = companyContext;
    }

    public List<TaxRateResponse> getAllTaxRates() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return taxRateRepository.findByIsActiveTrueAndCompany_Id(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TaxRateResponse getTaxRateById(Integer id) {
        return toResponse(findById(id));
    }

    public TaxRateResponse createTaxRate(TaxRateRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = findCompany(companyId);

        if (Boolean.TRUE.equals(request.isDefault())) {
            clearDefaultFlag(companyId);
        }

        TaxRate taxRate = TaxRate.builder()
                .name(request.name())
                .rate(request.rate())
                .type(request.type() != null ? request.type() : "VAT")
                .isDefault(Boolean.TRUE.equals(request.isDefault()))
                .company(company)
                .isActive(true)
                .build();

        return toResponse(taxRateRepository.save(taxRate));
    }

    public TaxRateResponse updateTaxRate(Integer id, TaxRateRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        TaxRate taxRate = findById(id);

        if (Boolean.TRUE.equals(request.isDefault())) {
            clearDefaultFlag(companyId);
        }

        taxRate.setName(request.name());
        taxRate.setRate(request.rate());
        taxRate.setType(request.type() != null ? request.type() : "VAT");
        taxRate.setIsDefault(Boolean.TRUE.equals(request.isDefault()));

        return toResponse(taxRateRepository.save(taxRate));
    }

    public void deactivateTaxRate(Integer id) {
        TaxRate taxRate = findById(id);
        taxRate.setIsActive(false);
        taxRateRepository.save(taxRate);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private TaxRate findById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return taxRateRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new RuntimeException("Tax rate not found: " + id));
    }

    /**
     * Clears the default flag only within the current company — doesn't
     * touch other companies' default tax rates.
     */
    private void clearDefaultFlag(Integer companyId) {
        taxRateRepository.findByIsDefaultTrueAndCompany_Id(companyId)
                .ifPresent(existing -> {
                    existing.setIsDefault(false);
                    taxRateRepository.save(existing);
                });
    }

    private Company findCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
    }

    private TaxRateResponse toResponse(TaxRate t) {
        return new TaxRateResponse(
                t.getId(),
                t.getName(),
                t.getRate(),
                t.getType(),
                t.getIsDefault(),
                t.getIsActive()
        );
    }
}