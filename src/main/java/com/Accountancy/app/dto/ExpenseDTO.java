package com.Accountancy.app.dto;

import com.Accountancy.app.entities.Expense.ExpenseStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenseDTO {

    // Used for CREATE request from frontend
    public record ExpenseRequest(
            Integer accountId,
            Integer taxRateId,
            String description,
            BigDecimal amount,
            LocalDate expenseDate,
            String receiptUrl
    ) {}

    // Used for responses
    public record ExpenseResponse(
            Integer id,
            Integer accountId,
            String accountName,
            String accountCode,
            Integer taxRateId,
            String taxRateName,
            String description,
            BigDecimal amount,
            LocalDate expenseDate,
            String receiptUrl,
            ExpenseStatus status,
            LocalDateTime createdAt
    ) {}
}