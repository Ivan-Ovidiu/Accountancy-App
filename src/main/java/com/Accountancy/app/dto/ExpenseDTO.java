package com.Accountancy.app.dto;

import com.Accountancy.app.entities.Expense.ExpenseStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenseDTO {

    public record ExpenseRequest(
            @NotNull(message = "Account is required")
            Integer accountId,

            Integer taxRateId,

            @Size(max = 255, message = "Description must not exceed 255 characters")
            String description,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be positive")
            BigDecimal amount,

            @NotNull(message = "Expense date is required")
            LocalDate expenseDate,

            @Size(max = 500)
            String receiptUrl
    ) {}

    public record ExpenseResponse(
            Integer id, Integer accountId, String accountName, String accountCode,
            Integer taxRateId, String taxRateName, String description, BigDecimal amount,
            LocalDate expenseDate, String receiptUrl, ExpenseStatus status, LocalDateTime createdAt
    ) {}
}
