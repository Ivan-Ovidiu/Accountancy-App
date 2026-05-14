package com.Accountancy.app.services;

import com.Accountancy.app.dto.BankOperationDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.BankOperation.OperationType;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.entities.Invoice.InvoiceStatus;
import com.Accountancy.app.entities.SupplierInvoice.SupplierInvoiceStatus;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BankOperationService {

    private final BankOperationRepository    bankOperationRepository;
    private final BankAccountRepository      bankAccountRepository;
    private final AccountRepository          accountRepository;
    private final JournalEntryRepository     journalEntryRepository;
    private final JournalLineRepository      journalLineRepository;
    private final UserRepository             userRepository;
    private final InvoiceRepository          invoiceRepository;
    private final SupplierInvoiceRepository  supplierInvoiceRepository;
    private final CompanyRepository          companyRepository;
    private final CompanyContext             companyContext;

    public BankOperationService(BankOperationRepository bankOperationRepository,
                                BankAccountRepository bankAccountRepository,
                                AccountRepository accountRepository,
                                JournalEntryRepository journalEntryRepository,
                                JournalLineRepository journalLineRepository,
                                UserRepository userRepository,
                                InvoiceRepository invoiceRepository,
                                SupplierInvoiceRepository supplierInvoiceRepository,
                                CompanyRepository companyRepository,
                                CompanyContext companyContext) {
        this.bankOperationRepository    = bankOperationRepository;
        this.bankAccountRepository      = bankAccountRepository;
        this.accountRepository          = accountRepository;
        this.journalEntryRepository     = journalEntryRepository;
        this.journalLineRepository      = journalLineRepository;
        this.userRepository             = userRepository;
        this.invoiceRepository          = invoiceRepository;
        this.supplierInvoiceRepository  = supplierInvoiceRepository;
        this.companyRepository          = companyRepository;
        this.companyContext             = companyContext;
    }

    public List<BankOperationResponse> getAllByBankAccount(Integer bankAccountId) {
        return bankOperationRepository.findByBankAccountId(bankAccountId)
                .stream().map(this::toResponse).toList();
    }

    public List<BankOperationResponse> getAll() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return bankOperationRepository.findAllByCompanyId(companyId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public BankOperationResponse createOperation(BankOperationRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        BankAccount bankAccount = bankAccountRepository.findByIdAndCompany_Id(request.bankAccountId(), companyId)
                .orElseThrow(() -> new RuntimeException("Bank account not found: " + request.bankAccountId()));

        Account debitAccount;
        Account creditAccount;

        switch (request.operationType()) {
            case COMMISSION -> {
                debitAccount  = getAccountByCode("627");
                creditAccount = getAccountByCode("5121");
            }
            case SUPPLIER_PAYMENT -> {
                debitAccount  = getAccountByCode("401");
                creditAccount = getAccountByCode("5121");
            }
            case CLIENT_RECEIPT -> {
                debitAccount  = getAccountByCode("5121");
                creditAccount = getAccountByCode("4111");
            }
            case INTEREST_EXP -> {
                debitAccount  = getAccountByCode("666");
                creditAccount = getAccountByCode("5121");
            }
            case INTEREST_INC -> {
                debitAccount  = getAccountByCode("5121");
                creditAccount = getAccountByCode("766");
            }
            default -> {
                if (request.debitAccountId() == null || request.creditAccountId() == null) {
                    throw new RuntimeException("For OTHER operations, debitAccountId and creditAccountId are required");
                }
                debitAccount  = accountRepository.findById(request.debitAccountId())
                        .orElseThrow(() -> new RuntimeException("Debit account not found: " + request.debitAccountId()));
                creditAccount = accountRepository.findById(request.creditAccountId())
                        .orElseThrow(() -> new RuntimeException("Credit account not found: " + request.creditAccountId()));
            }
        }

        BankOperation operation = BankOperation.builder()
                .company(company)
                .bankAccount(bankAccount)
                .user(user)
                .debitAccount(debitAccount)
                .creditAccount(creditAccount)
                .operationType(request.operationType())
                .description(request.description())
                .amount(request.amount())
                .operationDate(request.operationDate())
                .build();

        BankOperation saved = bankOperationRepository.save(operation);
        postJournalEntry(saved, user, company);

        // Marcare factură furnizor ca PAID după plată
        if (request.operationType() == OperationType.SUPPLIER_PAYMENT
                && request.supplierInvoiceId() != null) {
            supplierInvoiceRepository.findByIdAndCompanyId(request.supplierInvoiceId(), companyId)
                    .ifPresent(inv -> {
                        inv.setStatus(SupplierInvoiceStatus.PAID);
                        supplierInvoiceRepository.save(inv);
                    });
        }

        // Marcare factură client ca PAID după încasare
        if (request.operationType() == OperationType.CLIENT_RECEIPT
                && request.invoiceId() != null) {
            invoiceRepository.findByIdAndCompany_Id(request.invoiceId(), companyId)
                    .ifPresent(inv -> {
                        inv.setStatus(InvoiceStatus.PAID);
                        invoiceRepository.save(inv);
                    });
        }

        return toResponse(bankOperationRepository.save(saved));
    }

    // ── Delete operatiune bancara ─────────────────────────────────

    /**
     * Sterge o operatiune bancara:
     * 1. Sterge journal entry + lines (cascade)
     * 2. Reseteaza statusul facturii asociate (PAID -> REGISTERED / VALIDATED)
     * 3. Sterge bank operation
     */
    @Transactional
    public void deleteOperation(Integer id) {
        BankOperation op = bankOperationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank operation not found: " + id));

        Integer companyId = companyContext.requireCurrentCompanyId();

        // Pasul 1: nullify JE pe operation, sterge JE (cascade sterge si lines)
        JournalEntry je = op.getJournalEntry();
        op.setJournalEntry(null);
        bankOperationRepository.save(op);
        if (je != null) journalEntryRepository.delete(je);

        // Pasul 2: reseteaza statusul facturii furnizor (PAID -> REGISTERED)
        if (op.getOperationType() == OperationType.SUPPLIER_PAYMENT) {
            supplierInvoiceRepository.findAllByCompanyId(companyId).stream()
                    .filter(inv -> inv.getStatus() == SupplierInvoiceStatus.PAID)
                    .filter(inv -> inv.getPaymentJournalEntry() != null
                            && je != null
                            && inv.getPaymentJournalEntry().getId().equals(je.getId()))
                    .findFirst()
                    .ifPresent(inv -> {
                        inv.setStatus(SupplierInvoiceStatus.REGISTERED);
                        inv.setPaymentJournalEntry(null);
                        supplierInvoiceRepository.save(inv);
                    });
        }

        // Pasul 2b: reseteaza statusul facturii client (PAID -> VALIDATED)
        if (op.getOperationType() == OperationType.CLIENT_RECEIPT) {
            invoiceRepository.findByCompany_IdOrderByIssueDateDesc(companyId).stream()
                    .filter(inv -> inv.getStatus() == InvoiceStatus.PAID)
                    .filter(inv -> op.getDescription() != null
                            && op.getDescription().contains(inv.getInvoiceNumber()))
                    .findFirst()
                    .ifPresent(inv -> {
                        inv.setStatus(InvoiceStatus.VALIDATED);
                        invoiceRepository.save(inv);
                    });
        }

        // Pasul 3: sterge operatiunea
        bankOperationRepository.delete(op);
    }


    // ── Helpers ──────────────────────────────────────────────────

    private Account getAccountByCode(String code) {
        return accountRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Account " + code + " not found in chart of accounts"));
    }

    private void postJournalEntry(BankOperation operation, User user, Company company) {
        String refNumber = "BANK-" + operation.getId() + "-" + operation.getOperationDate();

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .company(company)
                .referenceNumber(refNumber)
                .entryDate(operation.getOperationDate())
                .description(operation.getDescription())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        // Fix: company setat pe ambele JournalLine-uri
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .company(company)
                .account(operation.getDebitAccount())
                .debitAmount(operation.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .description(operation.getDescription())
                .build());

        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .company(company)
                .account(operation.getCreditAccount())
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(operation.getAmount())
                .description(operation.getDescription())
                .build());

        operation.setJournalEntry(savedEntry);
    }

    private BankOperationResponse toResponse(BankOperation op) {
        return new BankOperationResponse(
                op.getId(),
                op.getBankAccount().getId(),
                op.getBankAccount().getAccountName(),
                op.getOperationType(),
                op.getDebitAccount().getId(),
                op.getDebitAccount().getCode(),
                op.getDebitAccount().getName(),
                op.getCreditAccount().getId(),
                op.getCreditAccount().getCode(),
                op.getCreditAccount().getName(),
                op.getDescription(),
                op.getAmount(),
                op.getOperationDate(),
                op.getJournalEntry() != null ? op.getJournalEntry().getReferenceNumber() : null,
                op.getCreatedAt()
        );
    }
}