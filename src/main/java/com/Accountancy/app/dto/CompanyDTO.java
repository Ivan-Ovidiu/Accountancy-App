package com.Accountancy.app.dto;

import com.Accountancy.app.entities.Company.ProfitTaxType;
import com.Accountancy.app.entities.Company.VatPeriod;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CompanyDTO {

    /** Used for both create and update (PUT replaces all fields). */
    public record CompanyRequest(
            @NotBlank(message = "Code is required")
            @Size(max = 10, message = "Code must not exceed 10 characters")
            String code,

            @NotBlank(message = "Name is required")
            @Size(max = 150, message = "Name must not exceed 150 characters")
            String name,

            @NotBlank(message = "Tax ID is required")
            @Size(max = 20, message = "Tax ID must not exceed 20 characters")
            String taxId,

            @Size(max = 30, message = "Trade register number must not exceed 30 characters")
            String tradeRegisterNo,

            @Size(max = 10, message = "CAEN code must not exceed 10 characters")
            String caenCode,

            @PositiveOrZero(message = "Share capital cannot be negative")
            BigDecimal shareCapital,

            // Sediu social
            @Size(max = 50)  String addressCounty,
            @Size(max = 100) String addressCity,
            @Size(max = 200) String addressStreet,
            @Size(max = 20)  String addressNumber,
            @Size(max = 20)  String addressBlock,
            @Size(max = 10)  String addressEntrance,
            @Size(max = 10)  String addressFloor,
            @Size(max = 10)  String addressApartment,
            @Size(max = 10)  String addressSector,
            @Size(max = 20)  String addressPostalCode,

            @Size(max = 30)
            String phone,

            @Email(message = "Invalid email format")
            @Size(max = 100)
            String email,

            @Size(max = 40, message = "IBAN must not exceed 40 characters")
            String primaryBankIban,

            @Size(max = 100)
            String primaryBankName,

            @NotNull(message = "VAT payer flag is required")
            Boolean vatPayer,

            @NotNull(message = "VAT period is required")
            VatPeriod vatPeriod,

            @NotNull(message = "VAT-on-collection flag is required")
            Boolean vatOnCollection,

            @NotNull(message = "Profit tax type is required")
            ProfitTaxType profitTaxType
    ) {}

    public record UserCompanyResponse(
            Integer userId,
            String userName,
            String userEmail,
            Boolean isDefault
    ) {}
    public record CompanyResponse(
            Integer id,
            String code,
            String name,
            String taxId,
            String tradeRegisterNo,
            String caenCode,
            BigDecimal shareCapital,

            String addressCounty,
            String addressCity,
            String addressStreet,
            String addressNumber,
            String addressBlock,
            String addressEntrance,
            String addressFloor,
            String addressApartment,
            String addressSector,
            String addressPostalCode,

            String phone,
            String email,

            String primaryBankIban,
            String primaryBankName,

            Boolean vatPayer,
            VatPeriod vatPeriod,
            Boolean vatOnCollection,
            ProfitTaxType profitTaxType,

            Boolean isActive,
            LocalDateTime createdAt
    ) {}

    /** Compact form used by the company-selector dropdown after login. */
    public record CompanySummary(
            Integer id,
            String code,
            String name,
            String taxId,
            Boolean isDefault
    ) {}

    /** Granting/revoking a user's access to a company (ADMIN only). */
    public record CompanyAccessRequest(
            @NotNull(message = "User ID is required")
            Integer userId,

            @NotNull(message = "Company ID is required")
            Integer companyId,

            Boolean isDefault
    ) {}
}