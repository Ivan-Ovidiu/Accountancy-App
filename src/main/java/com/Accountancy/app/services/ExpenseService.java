package com.Accountancy.app.services;

import com.Accountancy.app.dto.ExpenseDTO.ExpenseRequest;
import com.Accountancy.app.dto.ExpenseDTO.ExpenseResponse;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.Expense.ExpenseStatus;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.security.CompanyContext;
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
    private final CompanyRepository companyRepository;
    private final CompanyContext companyContext;

    public ExpenseService(ExpenseRepository expenseRepository,
                          AccountRepository accountRepository,
                          TaxRateRepository taxRateRepository,
                          JournalEntryRepository journalEntryRepository,
                          JournalLineRepository journalLineRepository,
                          UserRepository userRepository,
                          CompanyRepository companyRepository,
                          CompanyContext companyContext) {
        this.expenseRepository = expenseRepository;
        this.accountRepository = accountRepository;
        this.taxRateRepository = taxRateRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.companyContext = companyContext;
    }

    public List<ExpenseResponse> getAllExpenses() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return expenseRepository.findByCompany_IdOrderByExpenseDateDesc(companyId)
                .stream().map(this::toResponse).toList();
    }

    public ExpenseResponse getExpenseById(Integer id) {
        return toResponse(findById(id));
    }

    public List<ExpenseResponse> getExpensesByStatus(ExpenseStatus status) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return expenseRepository.findByStatusAndCompany_Id(status, companyId)
                .stream().map(this::toResponse).toList();
    }

    public List<ExpenseResponse> getExpensesByDateRange(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return expenseRepository.findByExpenseDateBetweenAndCompany_Id(from, to, companyId)
                .stream().map(this::toResponse).toList();
    }




    @Transactional
    public ExpenseResponse approveExpense(Integer id) {
        Expense expense = findById(id);

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new RuntimeException("Only PENDING expenses can be approved");
        }

        postExpenseJournalEntry(expense);

        expense.setStatus(ExpenseStatus.APPROVED);
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse rejectExpense(Integer id) {
        Expense expense = findById(id);

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new RuntimeException("Only PENDING expenses can be rejected");
        }

        expense.setStatus(ExpenseStatus.REJECTED);
        return toResponse(expenseRepository.save(expense));
    }

    // ── Helpers ──────────────────────────────────────────────────

    private void postExpenseJournalEntry(Expense expense) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        Integer companyId = expense.getCompany().getId();

        // 5121 must exist in THIS company's chart of accounts

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .company(expense.getCompany())
                .referenceNumber("EXP-" + expense.getId() + "-" + expense.getExpenseDate())
                .entryDate(expense.getExpenseDate())
                .description("Cheltuială: " + expense.getDescription())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        // DR 6xx — contul de cheltuială ales de user
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(expense.getAccount())
                .debitAmount(expense.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .description(expense.getDescription())
                .build());

        // CR 5121 — banii ies din bancă
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)

                .debitAmount(BigDecimal.ZERO)
                .creditAmount(expense.getAmount())
                .description("Plată din bancă: " + expense.getDescription())
                .build());

        expense.setJournalEntry(savedEntry);
    }

    private Expense findById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return expenseRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new RuntimeException("Expense not found: " + id));
    }

    private Company findCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
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