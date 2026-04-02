package com.Accountancy.app.dto;

import com.Accountancy.app.entities.Invoice.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDTO {

    // Single line item on the invoice
    public record InvoiceItemRequest(
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Integer accountId  // revenue account this line maps to (e.g. 4010 Consulting Revenue)
    ) {}

    // Full invoice creation request from frontend
    public record InvoiceRequest(
            Integer clientId,
            Integer taxRateId,
            LocalDate issueDate,
            LocalDate dueDate,
            String notes,
            List<InvoiceItemRequest> items
    ) {}

    // Single line item in response
    public record InvoiceItemResponse(
            Integer id,
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal total,
            Integer accountId,
            String accountName
    ) {}

    // Full invoice response
    public record InvoiceResponse(
            Integer id,
            String invoiceNumber,
            Integer clientId,
            String clientName,
            String clientTaxId,
            Integer taxRateId,
            String taxRateName,
            BigDecimal taxRate,
            LocalDate issueDate,
            LocalDate dueDate,
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal total,
            InvoiceStatus status,
            String notes,
            LocalDateTime createdAt,
            List<InvoiceItemResponse> items
    ) {}
}