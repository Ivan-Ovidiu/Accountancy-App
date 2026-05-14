package com.Accountancy.app.services;

import com.Accountancy.app.dto.BankDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.BankTransaction.ReconciliationStatus;
import com.Accountancy.app.entities.BankTransaction.TransactionType;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.security.CompanyContext;
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
    private final CompanyContext companyContext;

    public BankReconciliationService(BankTransactionRepository bankTransactionRepository,
                                     JournalLineRepository journalLineRepository,
                                     BankAccountService bankAccountService,
                                     CompanyContext companyContext) {
        this.bankTransactionRepository = bankTransactionRepository;
        this.journalLineRepository = journalLineRepository;
        this.bankAccountService = bankAccountService;
        this.companyContext = companyContext;
    }

    public List<BankTransactionResponse> getTransactionsByBankAccount(Integer bankAccountId) {
        // bankAccountService.findById validates company ownership
        bankAccountService.findById(bankAccountId);
        return bankTransactionRepository.findByBankAccountId(bankAccountId)
                .stream().map(this::toResponse).toList();
    }

    public List<BankTransactionResponse> getUnmatchedTransactions(Integer bankAccountId) {
        bankAccountService.findById(bankAccountId);
        return bankTransactionRepository.findUnmatchedByBankAccount(bankAccountId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CsvImportResult importCsv(Integer bankAccountId, MultipartFile file) {
        // Validates bank account belongs to current company
        BankAccount bankAccount = bankAccountService.findById(bankAccountId);

        int totalRows = 0, imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                totalRows++;

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

                    LocalDate date      = LocalDate.parse(parts[0].trim());
                    BigDecimal amount   = new BigDecimal(parts[1].trim());
                    String description  = parts[2].trim();
                    String reference    = parts.length > 3 ? parts[3].trim() : null;

                    TransactionType type = amount.compareTo(BigDecimal.ZERO) < 0
                            ? TransactionType.DEBIT : TransactionType.CREDIT;

                    bankTransactionRepository.save(BankTransaction.builder()
                            .bankAccount(bankAccount)
                            .transactionDate(date)
                            .amount(amount.abs())
                            .description(description)
                            .reference(reference)
                            .type(type)
                            .reconciliationStatus(ReconciliationStatus.UNMATCHED)
                            .build());

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

        autoMatch(bankAccountId);
        return new CsvImportResult(totalRows, imported, skipped, errors);
    }

    @Transactional
    public void autoMatch(Integer bankAccountId) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        List<BankTransaction> unmatched =
                bankTransactionRepository.findUnmatchedByBankAccount(bankAccountId);

        for (BankTransaction bt : unmatched) {
            // Only match journal lines from the SAME company — prevents cross-company match
            List<JournalLine> candidates = journalLineRepository
                    .findByJournalEntryEntryDateAndCompanyId(bt.getTransactionDate(), companyId);

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

    @Transactional
    public BankTransactionResponse manualMatch(ManualMatchRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        BankTransaction bt = bankTransactionRepository.findById(request.bankTransactionId())
                .orElseThrow(() -> new RuntimeException("Bank transaction not found"));

        // Verify the bank transaction belongs to this company
        if (!bt.getBankAccount().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("Bank transaction not found");
        }

        JournalLine line = journalLineRepository.findById(request.journalLineId())
                .orElseThrow(() -> new RuntimeException("Journal line not found"));

        // Verify the journal line belongs to this company
        if (!line.getJournalEntry().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("Journal line not found");
        }

        bt.setJournalLine(line);
        bt.setReconciliationStatus(ReconciliationStatus.MANUALLY_MATCHED);

        return toResponse(bankTransactionRepository.save(bt));
    }

    @Transactional
    public BankTransactionResponse unmatch(Integer bankTransactionId) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        BankTransaction bt = bankTransactionRepository.findById(bankTransactionId)
                .orElseThrow(() -> new RuntimeException("Bank transaction not found"));

        if (!bt.getBankAccount().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("Bank transaction not found");
        }

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