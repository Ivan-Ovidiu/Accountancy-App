package com.Accountancy.app.dto;

import com.Accountancy.app.entities.Invoice.InvoiceStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDTO {

    public record InvoiceItemRequest(
            @NotBlank(message = "Item description is required")
            String description,

            @NotNull(message = "Quantity is required")
            @Positive(message = "Quantity must be positive")
            BigDecimal quantity,

            @NotNull(message = "Unit price is required")
            @PositiveOrZero(message = "Unit price must be zero or positive")
            BigDecimal unitPrice,

            Integer accountId
    ) {}

    public record InvoiceRequest(
            @NotNull(message = "Client is required")
            Integer clientId,

            @NotNull(message = "Tax rate is required")
            Integer taxRateId,

            @NotNull(message = "Issue date is required")
            LocalDate issueDate,

            @NotNull(message = "Due date is required")
            LocalDate dueDate,

            @Size(max = 500)
            String notes,

            @NotEmpty(message = "Invoice must have at least one item")
            @Valid
            List<InvoiceItemRequest> items
    ) {}

    public record InvoiceItemResponse(
            Integer id, String description, BigDecimal quantity,
            BigDecimal unitPrice, BigDecimal total, Integer accountId, String accountName
    ) {}

    public record InvoiceResponse(
            Integer id, String invoiceNumber, Integer clientId, String clientName,
            String clientTaxId, Integer taxRateId, String taxRateName, BigDecimal taxRate,
            LocalDate issueDate, LocalDate dueDate, BigDecimal subtotal, BigDecimal taxAmount,
            BigDecimal total, InvoiceStatus status, String notes, LocalDateTime createdAt,
            List<InvoiceItemResponse> items
    ) {}
}