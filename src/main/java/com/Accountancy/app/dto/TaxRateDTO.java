package com.Accountancy.app.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class TaxRateDTO {

    public record TaxRateRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotNull(message = "Rate is required")
            @DecimalMin(value = "0.0", message = "Rate must be zero or positive")
            @DecimalMax(value = "100.0", message = "Rate must not exceed 100")
            BigDecimal rate,

            String type,

            Boolean isDefault
    ) {}

    public record TaxRateResponse(
            Integer id, String name, BigDecimal rate,
            String type, Boolean isDefault, Boolean isActive
    ) {}
}