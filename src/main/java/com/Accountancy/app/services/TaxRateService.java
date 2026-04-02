package com.Accountancy.app.services;

import com.Accountancy.app.dto.TaxRateDTO.TaxRateRequest;
import com.Accountancy.app.dto.TaxRateDTO.TaxRateResponse;
import com.Accountancy.app.entities.TaxRate;
import com.Accountancy.app.repositories.TaxRateRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaxRateService {

    private final TaxRateRepository taxRateRepository;

    public TaxRateService(TaxRateRepository taxRateRepository) {
        this.taxRateRepository = taxRateRepository;
    }

    public List<TaxRateResponse> getAllTaxRates() {
        return taxRateRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TaxRateResponse getTaxRateById(Integer id) {
        return toResponse(findById(id));
    }

    public TaxRateResponse createTaxRate(TaxRateRequest request) {
        // If this is set as default, remove default from others
        if (Boolean.TRUE.equals(request.isDefault())) {
            clearDefaultFlag();
        }

        TaxRate taxRate = TaxRate.builder()
                .name(request.name())
                .rate(request.rate())
                .type(request.type() != null ? request.type() : "VAT")
                .isDefault(Boolean.TRUE.equals(request.isDefault()))
                .isActive(true)
                .build();

        return toResponse(taxRateRepository.save(taxRate));
    }

    public TaxRateResponse updateTaxRate(Integer id, TaxRateRequest request) {
        TaxRate taxRate = findById(id);

        if (Boolean.TRUE.equals(request.isDefault())) {
            clearDefaultFlag();
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

    // Only one tax rate can be default at a time
    private void clearDefaultFlag() {
        taxRateRepository.findByIsDefaultTrue().ifPresent(existing -> {
            existing.setIsDefault(false);
            taxRateRepository.save(existing);
        });
    }

    private TaxRate findById(Integer id) {
        return taxRateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax rate not found: " + id));
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