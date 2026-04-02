package com.Accountancy.app.dto;

import java.math.BigDecimal;

public class TaxRateDTO {

    public record TaxRateRequest(
            String name,
            BigDecimal rate,
            String type,
            Boolean isDefault
    ) {}

    public record TaxRateResponse(
            Integer id,
            String name,
            BigDecimal rate,
            String type,
            Boolean isDefault,
            Boolean isActive
    ) {}
}