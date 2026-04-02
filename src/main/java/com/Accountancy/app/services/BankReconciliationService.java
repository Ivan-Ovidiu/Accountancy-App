package com.Accountancy.app.services;

import com.Accountancy.app.dto.BankDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.BankTransaction.ReconciliationStatus;
import com.Accountancy.app.entities.BankTransaction.TransactionType;
import com.Accountancy.app.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
public class BankReconciliationService {

    private final BankTransactionRepository bankTransactionRepository;
    private final JournalLineRepository journalLineRepository;
    private final BankAccountService bankAccountService;

    public BankReconciliationService(BankTransactionRepository bankTransactionRepository,
                                     JournalLineRepository journalLineRepository,
                                     BankAccountService bankAccountService) {
        this.bankTransactionRepository = bankTransactionRepository;
        this.journalLineRepository = journalLineRepository;
        this.bankAccountService = bankAccountService;
    }

    // GET all transactions for a bank account
    public List<BankTransactionResponse> getTransactionsByBankAccount(Integer bankAccountId) {
        return bankTransactionRepository.findByBankAccountId(bankAccountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET only unmatched transactions
    public List<BankTransactionResponse> getUnmatchedTransactions(Integer bankAccountId) {
        return bankTransactionRepository.findUnmatchedByBankAccount(bankAccountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================================================
    // IMPORT CSV
    // Expected format (no header row):
    // 2026-03-31,-500.00,ENEL ENERGIE SA,REF123
    // 2026-03-31,1428.00,PLATA FACTURA INV-2026-00001,REF456
    // ============================================================
    @Transactional
    public CsvImportResult importCsv(Integer bankAccountId, MultipartFile file) {
        BankAccount bankAccount = bankAccountService.findById(bankAccountId);

        int totalRows = 0;
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {

            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                totalRows++;

                // Skip empty lines and header rows
                if (line.isBlank() || line.toLowerCase().startsWith("date")) {
                    skipped++;
                    continue;
                }

                try {
                    String[] parts = line.split(",", 4);
                    if (parts.length < 3) {
                        errors.add("Line " + lineNumber + ": expected at least 3 columns");
                        skipped++;
                        continue;
                    }

                    LocalDate date   = LocalDate.parse(parts[0].trim());
                    BigDecimal amount = new BigDecimal(parts[1].trim());
                    String description = parts[2].trim();
                    String reference = parts.length > 3 ? parts[3].trim() : null;

                    // Determine type: negative amount = DEBIT (money out), positive = CREDIT (money in)
                    TransactionType type = amount.compareTo(BigDecimal.ZERO) < 0
                            ? TransactionType.DEBIT
                            : TransactionType.CREDIT;

                    BankTransaction transaction = BankTransaction.builder()
                            .bankAccount(bankAccount)
                            .transactionDate(date)
                            .amount(amount.abs())  // store absolute value, type field indicates direction
                            .description(description)
                            .reference(reference)
                            .type(type)
                            .reconciliationStatus(ReconciliationStatus.UNMATCHED)
                            .build();

                    bankTransactionRepository.save(transaction);
                    imported++;

                } catch (DateTimeParseException e) {
                    errors.add("Line " + lineNumber + ": invalid date format (expected YYYY-MM-DD)");
                    skipped++;
                } catch (NumberFormatException e) {
                    errors.add("Line " + lineNumber + ": invalid amount format");
                    skipped++;
                }
            }

        } catch (Exception e) {
            errors.add("Failed to read file: " + e.getMessage());
        }

        // After import, attempt auto-matching
        autoMatch(bankAccountId);

        return new CsvImportResult(totalRows, imported, skipped, errors);
    }

    // ============================================================
    // AUTO MATCH
    // Tries to match unmatched bank transactions to journal lines
    // by comparing amount and date
    // ============================================================
    @Transactional
    public void autoMatch(Integer bankAccountId) {
        List<BankTransaction> unmatched = bankTransactionRepository
                .findUnmatchedByBankAccount(bankAccountId);

        for (BankTransaction bt : unmatched) {
            // Look for a journal line with the same amount on the same date
            // DEBIT bank transaction → look for CREDIT journal line (money left account)
            // CREDIT bank transaction → look for DEBIT journal line (money entered account)
            List<JournalLine> candidates = journalLineRepository
                    .findByJournalEntryEntryDate(bt.getTransactionDate());

            for (JournalLine line : candidates) {
                boolean amountMatches = bt.getType() == TransactionType.DEBIT
                        ? line.getCreditAmount().compareTo(bt.getAmount()) == 0
                        : line.getDebitAmount().compareTo(bt.getAmount()) == 0;

                if (amountMatches && line.getBankTransaction() == null) {
                    bt.setJournalLine(line);
                    bt.setReconciliationStatus(ReconciliationStatus.MATCHED);
                    bankTransactionRepository.save(bt);
                    break;
                }
            }
        }
    }

    // ============================================================
    // MANUAL MATCH
    // User manually links a bank transaction to a journal line
    // ============================================================
    @Transactional
    public BankTransactionResponse manualMatch(ManualMatchRequest request) {
        BankTransaction bt = bankTransactionRepository.findById(request.bankTransactionId())
                .orElseThrow(() -> new RuntimeException("Bank transaction not found"));

        JournalLine line = journalLineRepository.findById(request.journalLineId())
                .orElseThrow(() -> new RuntimeException("Journal line not found"));

        bt.setJournalLine(line);
        bt.setReconciliationStatus(ReconciliationStatus.MANUALLY_MATCHED);

        return toResponse(bankTransactionRepository.save(bt));
    }

    // ============================================================
    // UNMATCH — revert a matched transaction back to UNMATCHED
    // ============================================================
    @Transactional
    public BankTransactionResponse unmatch(Integer bankTransactionId) {
        BankTransaction bt = bankTransactionRepository.findById(bankTransactionId)
                .orElseThrow(() -> new RuntimeException("Bank transaction not found"));

        bt.setJournalLine(null);
        bt.setReconciliationStatus(ReconciliationStatus.UNMATCHED);

        return toResponse(bankTransactionRepository.save(bt));
    }

    private BankTransactionResponse toResponse(BankTransaction bt) {
        return new BankTransactionResponse(
                bt.getId(),
                bt.getBankAccount().getId(),
                bt.getBankAccount().getAccountName(),
                bt.getTransactionDate(),
                bt.getAmount(),
                bt.getDescription(),
                bt.getReference(),
                bt.getType(),
                bt.getReconciliationStatus(),
                bt.getJournalLine() != null ? bt.getJournalLine().getId() : null,
                bt.getImportedAt()
        );
    }
}