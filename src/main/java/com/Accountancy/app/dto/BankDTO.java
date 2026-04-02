package com.Accountancy.app.dto;

import com.Accountancy.app.entities.BankTransaction.ReconciliationStatus;
import com.Accountancy.app.entities.BankTransaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class BankDTO {

    // ============================================================
    // BANK ACCOUNT
    // ============================================================
    public record BankAccountRequest(
            String bankName,
            String accountNumber,
            String accountName,
            BigDecimal currentBalance,
            String currency,
            Integer accountId  // links to chart of accounts (e.g. 1010 Bank RON)
    ) {}

    public record BankAccountResponse(
            Integer id,
            String bankName,
            String accountNumber,
            String accountName,
            BigDecimal currentBalance,
            String currency,
            Integer accountId,
            String accountName2,
            Boolean isActive,
            LocalDateTime createdAt
    ) {}

    // ============================================================
    // BANK TRANSACTION
    // ============================================================
    public record BankTransactionResponse(
            Integer id,
            Integer bankAccountId,
            String bankAccountName,
            LocalDate transactionDate,
            BigDecimal amount,
            String description,
            String reference,
            TransactionType type,
            ReconciliationStatus reconciliationStatus,
            Integer journalLineId,
            LocalDateTime importedAt
    ) {}

    // ============================================================
    // CSV IMPORT
    // Each row in the CSV maps to this
    // Expected CSV format: date,amount,description,reference
    // Example: 2026-03-31,-500.00,ENEL ENERGIE SA,REF123
    // ============================================================
    public record CsvImportResult(
            int totalRows,
            int imported,
            int skipped,
            List<String> errors
    ) {}

    // ============================================================
    // MANUAL MATCH REQUEST
    // Frontend sends this to manually match a bank transaction
    // to an existing journal line
    // ============================================================
    public record ManualMatchRequest(
            Integer bankTransactionId,
            Integer journalLineId
    ) {}
}