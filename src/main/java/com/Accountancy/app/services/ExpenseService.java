package com.Accountancy.app.services;

import com.Accountancy.app.dto.ExpenseDTO.ExpenseRequest;
import com.Accountancy.app.dto.ExpenseDTO.ExpenseResponse;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.Expense.ExpenseStatus;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.repositories.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final AccountRepository accountRepository;
    private final TaxRateRepository taxRateRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalLineRepository journalLineRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository,
                          AccountRepository accountRepository,
                          TaxRateRepository taxRateRepository,
                          JournalEntryRepository journalEntryRepository,
                          JournalLineRepository journalLineRepository,
                          UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.accountRepository = accountRepository;
        this.taxRateRepository = taxRateRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
    }

    // GET all expenses
    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET expense by id
    public ExpenseResponse getExpenseById(Integer id) {
        return toResponse(findById(id));
    }

    // GET expenses by status
    public List<ExpenseResponse> getExpensesByStatus(ExpenseStatus status) {
        return expenseRepository.findByStatus(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET expenses by date range
    public List<ExpenseResponse> getExpensesByDateRange(LocalDate from, LocalDate to) {
        return expenseRepository.findByExpenseDateBetween(from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET expenses by account
    public List<ExpenseResponse> getExpensesByAccount(Integer accountId) {
        return expenseRepository.findByAccountId(accountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // POST — create expense as PENDING
    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new RuntimeException("Account not found: " + request.accountId()));

        if (account.getType() != Account.AccountType.EXPENSE) {
            throw new RuntimeException("Account must be of type EXPENSE");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Expense expense = Expense.builder()
                .user(user)
                .account(account)
                .description(request.description())
                .amount(request.amount())
                .expenseDate(request.expenseDate())
                .receiptUrl(request.receiptUrl())
                .status(ExpenseStatus.PENDING)
                .build();

        if (request.taxRateId() != null) {
            TaxRate taxRate = taxRateRepository.findById(request.taxRateId())
                    .orElseThrow(() -> new RuntimeException("Tax rate not found: " + request.taxRateId()));
            expense.setTaxRate(taxRate);
        }

        return toResponse(expenseRepository.save(expense));
    }

    // POST — approve expense (PENDING → APPROVED) and post journal entry
    @Transactional
    public ExpenseResponse approveExpense(Integer id) {
        Expense expense = findById(id);

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new RuntimeException("Only PENDING expenses can be approved");
        }

        // Post journal entry
        // Formula contabila:  6xx = 5121
        // DR 6xx  Cont de cheltuială (ales de user) — cheltuiala crește
        // CR 5121 Conturi la bănci în lei           — banii ies din bancă
        postExpenseJournalEntry(expense);

        expense.setStatus(ExpenseStatus.APPROVED);
        return toResponse(expenseRepository.save(expense));
    }

    // POST — reject expense (PENDING → REJECTED)
    @Transactional
    public ExpenseResponse rejectExpense(Integer id) {
        Expense expense = findById(id);

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new RuntimeException("Only PENDING expenses can be rejected");
        }

        expense.setStatus(ExpenseStatus.REJECTED);
        return toResponse(expenseRepository.save(expense));
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    // Posts the double-entry journal entry when expense is approved
    // Formula contabila:  6xx = 5121
    // DR 6xx  Cont de cheltuială — suma cheltuielii
    // CR 5121 Conturi la bănci   — plata din contul bancar
    private void postExpenseJournalEntry(Expense expense) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        // Cont 5121 — Conturi la bănci în lei (plata se face din bancă)
        Account banca = accountRepository.findByCode("5121")
                .orElseThrow(() -> new RuntimeException("Contul 5121 (Conturi la bănci în lei) nu există în planul de conturi. Adaugă-l mai întâi."));

        // Create journal entry header
        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .referenceNumber("EXP-" + expense.getId() + "-" + expense.getExpenseDate())
                .entryDate(expense.getExpenseDate())
                .description("Cheltuială: " + expense.getDescription())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        // DR 6xx — contul de cheltuială ales de user (ex: 604, 605, 612, 626, etc.)
        JournalLine debitLine = JournalLine.builder()
                .journalEntry(savedEntry)
                .account(expense.getAccount())
                .debitAmount(expense.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .description(expense.getDescription())
                .build();

        // CR 5121 — Conturi la bănci în lei (banii ies din bancă)
        JournalLine creditLine = JournalLine.builder()
                .journalEntry(savedEntry)
                .account(banca)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(expense.getAmount())
                .description("Plată din bancă: " + expense.getDescription())
                .build();

        journalLineRepository.save(debitLine);
        journalLineRepository.save(creditLine);

        expense.setJournalEntry(savedEntry);
    }

    private Expense findById(Integer id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found: " + id));
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getAccount().getId(),
                expense.getAccount().getName(),
                expense.getAccount().getCode(),
                expense.getTaxRate() != null ? expense.getTaxRate().getId() : null,
                expense.getTaxRate() != null ? expense.getTaxRate().getName() : null,
                expense.getDescription(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getReceiptUrl(),
                expense.getStatus(),
                expense.getCreatedAt()
        );
    }
}