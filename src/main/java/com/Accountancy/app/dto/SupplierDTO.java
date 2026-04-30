package com.Accountancy.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SupplierDTO {

    public record SupplierRequest(
            String name,
            String email,
            String phone,
            String address,
            String taxId
    ) {}

    public record SupplierResponse(
            Integer id,
            String name,
            String email,
            String phone,
            String address,
            String taxId,
            Boolean isActive,
            LocalDateTime createdAt
    ) {}

    // ── Supplier Invoice ────────────────────────────────────────

    public record SupplierInvoiceRequest(
            Integer supplierId,
            Integer expenseAccountId,
            Integer taxRateId,          // optional
            String invoiceNumber,       // numarul de pe factura furnizorului
            LocalDate issueDate,
            LocalDate dueDate,
            BigDecimal subtotal,
            String notes
    ) {}

    public record SupplierInvoiceResponse(
            Integer id,
            Integer supplierId,
            String supplierName,
            String supplierTaxId,
            Integer expenseAccountId,
            String expenseAccountCode,
            String expenseAccountName,
            Integer taxRateId,
            String taxRateName,
            BigDecimal taxRate,
            String invoiceNumber,
            LocalDate issueDate,
            LocalDate dueDate,
            BigDecimal subtotal,
            BigDecimal vatAmount,
            BigDecimal total,
            String status,
            String notes,
            LocalDateTime createdAt
    ) {}
}