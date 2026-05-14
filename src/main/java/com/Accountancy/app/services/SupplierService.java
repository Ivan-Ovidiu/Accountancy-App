package com.Accountancy.app.services;

import com.Accountancy.app.dto.SupplierDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.BankOperation.OperationType;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.entities.SupplierInvoice.SupplierInvoiceStatus;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierInvoiceRepository supplierInvoiceRepository;
    private final AccountRepository accountRepository;
    private final TaxRateRepository taxRateRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalLineRepository journalLineRepository;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankOperationRepository bankOperationRepository;
    private final CompanyRepository companyRepository;
    private final CompanyContext companyContext;

    public SupplierService(SupplierRepository supplierRepository,
                           SupplierInvoiceRepository supplierInvoiceRepository,
                           AccountRepository accountRepository,
                           TaxRateRepository taxRateRepository,
                           JournalEntryRepository journalEntryRepository,
                           JournalLineRepository journalLineRepository,
                           UserRepository userRepository,
                           BankAccountRepository bankAccountRepository,
                           BankOperationRepository bankOperationRepository,
                           CompanyRepository companyRepository,
                           CompanyContext companyContext) {
        this.supplierRepository = supplierRepository;
        this.supplierInvoiceRepository = supplierInvoiceRepository;
        this.accountRepository = accountRepository;
        this.taxRateRepository = taxRateRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.bankOperationRepository = bankOperationRepository;
        this.companyRepository = companyRepository;
        this.companyContext = companyContext;
    }

    // ============================================================
    // SUPPLIERS CRUD
    // ============================================================

    public List<SupplierResponse> getAllSuppliers() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return supplierRepository.findByIsActiveTrueAndCompany_Id(companyId)
                .stream().map(this::toSupplierResponse).toList();
    }

    public SupplierResponse getSupplierById(Integer id) {
        return toSupplierResponse(findSupplierById(id));
    }

    public SupplierResponse createSupplier(SupplierRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = findCompany(companyId);
        Supplier supplier = Supplier.builder()
                .name(request.name()).email(request.email()).phone(request.phone())
                .address(request.address()).taxId(request.taxId()).company(company).isActive(true)
                .build();
        return toSupplierResponse(supplierRepository.save(supplier));
    }

    public SupplierResponse updateSupplier(Integer id, SupplierRequest request) {
        Supplier supplier = findSupplierById(id);
        supplier.setName(request.name()); supplier.setEmail(request.email());
        supplier.setPhone(request.phone()); supplier.setAddress(request.address());
        supplier.setTaxId(request.taxId());
        return toSupplierResponse(supplierRepository.save(supplier));
    }

    public void deactivateSupplier(Integer id) {
        Supplier supplier = findSupplierById(id);
        supplier.setIsActive(false);
        supplierRepository.save(supplier);
    }

    // ============================================================
    // SUPPLIER INVOICES
    // ============================================================

    public List<SupplierInvoiceResponse> getAllSupplierInvoices() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return supplierInvoiceRepository.findAllByCompanyId(companyId)
                .stream().map(this::toInvoiceResponse).toList();
    }

    public SupplierInvoiceResponse getSupplierInvoiceById(Integer id) {
        return toInvoiceResponse(findInvoiceById(id));
    }

    public List<SupplierInvoiceResponse> getInvoicesBySupplier(Integer supplierId) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        findSupplierById(supplierId);
        return supplierInvoiceRepository.findBySupplierIdAndCompanyId(supplierId, companyId)
                .stream().map(this::toInvoiceResponse).toList();
    }

    @Transactional
    public SupplierInvoiceResponse createSupplierInvoice(SupplierInvoiceRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Supplier supplier = findSupplierById(request.supplierId());

        Account expenseAccount = accountRepository.findById(request.expenseAccountId())
                .orElseThrow(() -> new RuntimeException("Contul de cheltuiala nu exista: " + request.expenseAccountId()));
        String code = expenseAccount.getCode();
        if (!code.matches("^[234567].*")) {
            throw new RuntimeException("Contul ales trebuie sa fie din clasele 2-7");
        }

        TaxRate taxRate = null;
        BigDecimal vatAmount = BigDecimal.ZERO;
        if (request.taxRateId() != null) {
            taxRate = taxRateRepository.findByIdAndCompany_Id(request.taxRateId(), companyId)
                    .orElseThrow(() -> new RuntimeException("Cota TVA nu exista: " + request.taxRateId()));
            vatAmount = request.subtotal()
                    .multiply(taxRate.getRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        SupplierInvoice invoice = SupplierInvoice.builder()
                .supplier(supplier).user(user).expenseAccount(expenseAccount).taxRate(taxRate)
                .invoiceNumber(request.invoiceNumber()).issueDate(request.issueDate()).dueDate(request.dueDate())
                .subtotal(request.subtotal()).vatAmount(vatAmount).total(request.subtotal().add(vatAmount))
                .status(SupplierInvoiceStatus.PENDING).notes(request.notes())
                .build();

        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }

    @Transactional
    public SupplierInvoiceResponse registerSupplierInvoice(Integer id) {
        SupplierInvoice invoice = findInvoiceById(id);
        if (invoice.getStatus() != SupplierInvoiceStatus.PENDING) {
            throw new RuntimeException("Doar facturile PENDING pot fi înregistrate. Status curent: " + invoice.getStatus());
        }
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = findCompany(companyId);
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        postRegistrationJournalEntry(invoice, invoice.getVatAmount(), user, company);
        invoice.setStatus(SupplierInvoiceStatus.REGISTERED);
        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }

    @Transactional
    public SupplierInvoiceResponse paySupplierInvoice(Integer id) {
        SupplierInvoice invoice = findInvoiceById(id);
        Integer companyId = invoice.getSupplier().getCompany().getId();
        if (invoice.getStatus() != SupplierInvoiceStatus.REGISTERED && invoice.getStatus() != SupplierInvoiceStatus.OVERDUE) {
            throw new RuntimeException("Doar facturile REGISTERED sau OVERDUE pot fi platite. Status curent: " + invoice.getStatus());
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        Company company = findCompany(companyId);
        JournalEntry paymentEntry = postPaymentJournalEntry(invoice, user, company);
        createBankOperationForPayment(invoice, paymentEntry, user, companyId);
        invoice.setStatus(SupplierInvoiceStatus.PAID);
        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }

    @Transactional
    public SupplierInvoiceResponse voidSupplierInvoice(Integer id) {
        SupplierInvoice invoice = findInvoiceById(id);
        if (invoice.getStatus() == SupplierInvoiceStatus.PAID) {
            throw new RuntimeException("Nu se poate anula o factura deja platita");
        }
        invoice.setStatus(SupplierInvoiceStatus.VOID);
        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }

    @Transactional
    public int checkAndMarkOverdue() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        List<SupplierInvoice> candidates = supplierInvoiceRepository
                .findByStatusAndCompany_Id(SupplierInvoiceStatus.REGISTERED, companyId);
        List<SupplierInvoice> toUpdate = candidates.stream()
                .filter(i -> i.getDueDate().isBefore(LocalDate.now())).toList();
        toUpdate.forEach(i -> i.setStatus(SupplierInvoiceStatus.OVERDUE));
        supplierInvoiceRepository.saveAll(toUpdate);
        return toUpdate.size();
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private void postRegistrationJournalEntry(SupplierInvoice invoice, BigDecimal vatAmount,
                                              User user, Company company) {
        Account furnizori = getAccount("401");
        JournalEntry entry = JournalEntry.builder()
                .user(user).company(company)
                .referenceNumber("SINV-" + invoice.getId() + "-" + invoice.getIssueDate())
                .entryDate(invoice.getIssueDate())
                .description("Factura furnizor " + invoice.getInvoiceNumber() + " - " + invoice.getSupplier().getName())
                .status(JournalStatus.POSTED)
                .build();
        JournalEntry savedEntry = journalEntryRepository.save(entry);

        journalLineRepository.save(JournalLine.builder()
                .company(company).journalEntry(savedEntry).account(invoice.getExpenseAccount())
                .debitAmount(invoice.getSubtotal()).creditAmount(BigDecimal.ZERO)
                .description("Cheltuiala: " + invoice.getSupplier().getName()).build());

        if (vatAmount.compareTo(BigDecimal.ZERO) > 0) {
            journalLineRepository.save(JournalLine.builder()
                    .company(company).journalEntry(savedEntry).account(getAccount("4426"))
                    .debitAmount(vatAmount).creditAmount(BigDecimal.ZERO)
                    .description("TVA deductibila " + invoice.getInvoiceNumber()).build());
        }

        journalLineRepository.save(JournalLine.builder()
                .company(company).journalEntry(savedEntry).account(furnizori)
                .debitAmount(BigDecimal.ZERO).creditAmount(invoice.getTotal())
                .description("Datorie furnizor: " + invoice.getSupplier().getName()).build());

        invoice.setJournalEntry(savedEntry);
    }

    private JournalEntry postPaymentJournalEntry(SupplierInvoice invoice, User user, Company company) {
        Account furnizori = getAccount("401");
        Account banca     = getAccount("5121");
        JournalEntry entry = JournalEntry.builder()
                .user(user).company(company)
                .referenceNumber("PAY-" + invoice.getId() + "-" + LocalDate.now())
                .entryDate(LocalDate.now())
                .description("Plata factura " + invoice.getInvoiceNumber() + " - " + invoice.getSupplier().getName())
                .status(JournalStatus.POSTED)
                .build();
        JournalEntry savedEntry = journalEntryRepository.save(entry);

        journalLineRepository.save(JournalLine.builder()
                .company(company).journalEntry(savedEntry).account(furnizori)
                .debitAmount(invoice.getTotal()).creditAmount(BigDecimal.ZERO)
                .description("Plata furnizor: " + invoice.getSupplier().getName()).build());

        journalLineRepository.save(JournalLine.builder()
                .company(company).journalEntry(savedEntry).account(banca)
                .debitAmount(BigDecimal.ZERO).creditAmount(invoice.getTotal())
                .description("Plata din banca: " + invoice.getInvoiceNumber()).build());

        invoice.setPaymentJournalEntry(savedEntry);
        return savedEntry;
    }

    private void createBankOperationForPayment(SupplierInvoice invoice, JournalEntry journalEntry,
                                               User user, Integer companyId) {
        List<BankAccount> bankAccounts = bankAccountRepository.findByIsActiveTrueAndCompany_Id(companyId);
        if (bankAccounts.isEmpty()) return;
        BankAccount bankAccount = bankAccounts.get(0);
        Company company = findCompany(companyId);

        bankOperationRepository.save(BankOperation.builder()
                .company(company).bankAccount(bankAccount).user(user)
                .debitAccount(getAccount("401")).creditAccount(getAccount("5121"))
                .operationType(OperationType.SUPPLIER_PAYMENT)
                .description("Plata furnizor: " + invoice.getSupplier().getName() + " - " + invoice.getInvoiceNumber())
                .amount(invoice.getTotal()).operationDate(LocalDate.now()).journalEntry(journalEntry)
                .build());
    }

    private Account getAccount(String code) {
        return accountRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Contul " + code + " nu exista in planul de conturi"));
    }

    /**
     * Editează o factură furnizor PENDING — recalculează TVA și total.
     */
    @Transactional
    public SupplierInvoiceResponse updateSupplierInvoice(Integer id, SupplierInvoiceRequest request) {
        SupplierInvoice invoice = findInvoiceById(id);
        if (invoice.getStatus() != SupplierInvoiceStatus.PENDING) {
            throw new RuntimeException("Doar facturile PENDING pot fi editate. Status curent: " + invoice.getStatus());
        }
        Integer companyId = companyContext.requireCurrentCompanyId();

        Supplier supplier = findSupplierById(request.supplierId());
        Account expenseAccount = accountRepository.findById(request.expenseAccountId())
                .orElseThrow(() -> new RuntimeException("Contul de cheltuiala nu exista: " + request.expenseAccountId()));

        TaxRate taxRate = null;
        BigDecimal vatAmount = BigDecimal.ZERO;
        if (request.taxRateId() != null) {
            taxRate = taxRateRepository.findByIdAndCompany_Id(request.taxRateId(), companyId)
                    .orElseThrow(() -> new RuntimeException("Cota TVA nu exista: " + request.taxRateId()));
            vatAmount = request.subtotal()
                    .multiply(taxRate.getRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        invoice.setSupplier(supplier);
        invoice.setExpenseAccount(expenseAccount);
        invoice.setTaxRate(taxRate);
        invoice.setInvoiceNumber(request.invoiceNumber());
        invoice.setIssueDate(request.issueDate());
        invoice.setDueDate(request.dueDate());
        invoice.setSubtotal(request.subtotal());
        invoice.setVatAmount(vatAmount);
        invoice.setTotal(request.subtotal().add(vatAmount));
        invoice.setNotes(request.notes());

        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }


    // ============================================================
    // DELETE SUPPLIER INVOICE
    // ============================================================

    /**
     * Șterge o factură furnizor respectând ordinea FK:
     *   PAID:                  BankOperation (+ JE plată) → JE înregistrare → SupplierInvoice
     *   REGISTERED/OVERDUE:    JE înregistrare → SupplierInvoice
     *   PENDING/VOID:          SupplierInvoice direct
     */
    @Transactional
    public void deleteSupplierInvoice(Integer id) {
        SupplierInvoice invoice = findInvoiceById(id);

        // Pasul 1: dacă e PAID, ștergem bank operation + JE plată
        if (invoice.getStatus() == SupplierInvoiceStatus.PAID) {
            JournalEntry payJe = invoice.getPaymentJournalEntry();
            if (payJe != null) {
                bankOperationRepository.findByJournalEntry_Id(payJe.getId())
                        .ifPresent(op -> {
                            op.setJournalEntry(null);
                            bankOperationRepository.save(op);
                            bankOperationRepository.delete(op);
                        });
                invoice.setPaymentJournalEntry(null);
                supplierInvoiceRepository.save(invoice);
                journalEntryRepository.delete(payJe);
            }
        }

        // Pasul 2: ștergem JE de înregistrare dacă există
        if (invoice.getJournalEntry() != null) {
            JournalEntry je = invoice.getJournalEntry();
            invoice.setJournalEntry(null);
            supplierInvoiceRepository.save(invoice);
            journalEntryRepository.delete(je);
        }

        // Pasul 3: ștergem factura
        supplierInvoiceRepository.delete(invoice);
    }

    private Supplier findSupplierById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return supplierRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new RuntimeException("Furnizorul nu exista: " + id));
    }

    private SupplierInvoice findInvoiceById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return supplierInvoiceRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Factura furnizor nu exista: " + id));
    }

    private Company findCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
    }

    private SupplierResponse toSupplierResponse(Supplier s) {
        return new SupplierResponse(s.getId(), s.getName(), s.getEmail(), s.getPhone(),
                s.getAddress(), s.getTaxId(), s.getIsActive(), s.getCreatedAt());
    }

    private SupplierInvoiceResponse toInvoiceResponse(SupplierInvoice inv) {
        return new SupplierInvoiceResponse(
                inv.getId(),
                inv.getSupplier().getId(), inv.getSupplier().getName(), inv.getSupplier().getTaxId(),
                inv.getExpenseAccount().getId(), inv.getExpenseAccount().getCode(), inv.getExpenseAccount().getName(),
                inv.getTaxRate() != null ? inv.getTaxRate().getId() : null,
                inv.getTaxRate() != null ? inv.getTaxRate().getName() : null,
                inv.getTaxRate() != null ? inv.getTaxRate().getRate() : null,
                inv.getInvoiceNumber(), inv.getIssueDate(), inv.getDueDate(),
                inv.getSubtotal(), inv.getVatAmount(), inv.getTotal(),
                inv.getStatus().name(), inv.getNotes(), inv.getCreatedAt()
        );
    }
}