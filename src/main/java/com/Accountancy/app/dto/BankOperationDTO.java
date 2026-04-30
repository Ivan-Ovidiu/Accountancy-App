package com.Accountancy.app.dto;

import com.Accountancy.app.entities.BankOperation.OperationType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BankOperationDTO {

    public record BankOperationRequest(
            Integer bankAccountId,
            OperationType operationType,
            Integer debitAccountId,     // doar pentru OTHER
            Integer creditAccountId,    // doar pentru OTHER
            String description,
            BigDecimal amount,
            LocalDate operationDate
    ) {}

    public record BankOperationResponse(
            Integer id,
            Integer bankAccountId,
            String bankAccountName,
            OperationType operationType,
            Integer debitAccountId,
            String debitAccountCode,
            String debitAccountName,
            Integer creditAccountId,
            String creditAccountCode,
            String creditAccountName,
            String description,
            BigDecimal amount,
            LocalDate operationDate,
            String journalEntryReference,
            LocalDateTime createdAt
    ) {}
}