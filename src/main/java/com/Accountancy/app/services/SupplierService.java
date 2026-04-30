package com.Accountancy.app.services;

import com.Accountancy.app.dto.SupplierDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.BankOperation.OperationType;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.entities.SupplierInvoice.SupplierInvoiceStatus;
import com.Accountancy.app.repositories.*;
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

    public SupplierService(SupplierRepository supplierRepository,
                           SupplierInvoiceRepository supplierInvoiceRepository,
                           AccountRepository accountRepository,
                           TaxRateRepository taxRateRepository,
                           JournalEntryRepository journalEntryRepository,
                           JournalLineRepository journalLineRepository,
                           UserRepository userRepository,
                           BankAccountRepository bankAccountRepository,
                           BankOperationRepository bankOperationRepository) {
        this.supplierRepository = supplierRepository;
        this.supplierInvoiceRepository = supplierInvoiceRepository;
        this.accountRepository = accountRepository;
        this.taxRateRepository = taxRateRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.bankOperationRepository = bankOperationRepository;
    }

    // ============================================================
    // SUPPLIERS CRUD
    // ============================================================

    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findByIsActiveTrue().stream().map(this::toSupplierResponse).toList();
    }

    public SupplierResponse getSupplierById(Integer id) {
        return toSupplierResponse(findSupplierById(id));
    }

    public SupplierResponse createSupplier(SupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .taxId(request.taxId())
                .isActive(true)
                .build();
        return toSupplierResponse(supplierRepository.save(supplier));
    }

    public SupplierResponse updateSupplier(Integer id, SupplierRequest request) {
        Supplier supplier = findSupplierById(id);
        supplier.setName(request.name());
        supplier.setEmail(request.email());
        supplier.setPhone(request.phone());
        supplier.setAddress(request.address());
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
        return supplierInvoiceRepository.findAll().stream().map(this::toInvoiceResponse).toList();
    }

    public SupplierInvoiceResponse getSupplierInvoiceById(Integer id) {
        return toInvoiceResponse(findInvoiceById(id));
    }

    public List<SupplierInvoiceResponse> getInvoicesBySupplier(Integer supplierId) {
        return supplierInvoiceRepository.findBySupplierId(supplierId).stream().map(this::toInvoiceResponse).toList();
    }

    // Inregistreaza factura primita si posteaza nota contabila:
    // DR 6xx (cheltuiala)       — subtotal
    // DR 4426 (TVA deductibila) — valoarea TVA
    // CR 401  (Furnizori)       — total (subtotal + TVA)
    @Transactional
    public SupplierInvoiceResponse createSupplierInvoice(SupplierInvoiceRequest request) {
        Supplier supplier = findSupplierById(request.supplierId());
        Account expenseAccount = accountRepository.findById(request.expenseAccountId())
                .orElseThrow(() -> new RuntimeException("Contul de cheltuiala nu exista: " + request.expenseAccountId()));

        if (expenseAccount.getType() != Account.AccountType.EXPENSE) {
            throw new RuntimeException("Contul ales trebuie sa fie de tip EXPENSE (clasa 6)");
        }

        TaxRate taxRate = null;
        BigDecimal vatAmount = BigDecimal.ZERO;
        if (request.taxRateId() != null) {
            taxRate = taxRateRepository.findById(request.taxRateId())
                    .orElseThrow(() -> new RuntimeException("Cota TVA nu exista: " + request.taxRateId()));
            vatAmount = request.subtotal()
                    .multiply(taxRate.getRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        BigDecimal total = request.subtotal().add(vatAmount);

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        SupplierInvoice invoice = SupplierInvoice.builder()
                .supplier(supplier)
                .user(user)
                .expenseAccount(expenseAccount)
                .taxRate(taxRate)
                .invoiceNumber(request.invoiceNumber())
                .issueDate(request.issueDate())
                .dueDate(request.dueDate())
                .subtotal(request.subtotal())
                .vatAmount(vatAmount)
                .total(total)
                .status(SupplierInvoiceStatus.PENDING)
                .notes(request.notes())
                .build();

        SupplierInvoice saved = supplierInvoiceRepository.save(invoice);

        // Posteaza nota contabila la inregistrare: 6xx + 4426 = 401
        postRegistrationJournalEntry(saved, vatAmount, user);

        return toInvoiceResponse(supplierInvoiceRepository.save(saved));
    }

    // Inregistreaza plata facturii furnizorului:
    // DR 401  (Furnizori)        — total
    // CR 5121 (Conturi la banci) — banii ies din banca
    // + creeaza bank_operation ca sa apara in Jurnalul de Banca
    @Transactional
    public SupplierInvoiceResponse paySupplierInvoice(Integer id) {
        SupplierInvoice invoice = findInvoiceById(id);

        if (invoice.getStatus() != SupplierInvoiceStatus.PENDING &&
                invoice.getStatus() != SupplierInvoiceStatus.OVERDUE) {
            throw new RuntimeException("Doar facturile PENDING sau OVERDUE pot fi platite");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        // Posteaza nota contabila 401 = 5121
        JournalEntry paymentEntry = postPaymentJournalEntry(invoice, user);

        // Creeaza inregistrare in bank_operations ca sa apara in Jurnalul de Banca
        createBankOperationForPayment(invoice, paymentEntry, user);

        invoice.setStatus(SupplierInvoiceStatus.PAID);
        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }

    // Anuleaza factura
    @Transactional
    public SupplierInvoiceResponse voidSupplierInvoice(Integer id) {
        SupplierInvoice invoice = findInvoiceById(id);
        if (invoice.getStatus() == SupplierInvoiceStatus.PAID) {
            throw new RuntimeException("Nu se poate anula o factura deja platita");
        }
        invoice.setStatus(SupplierInvoiceStatus.VOID);
        return toInvoiceResponse(supplierInvoiceRepository.save(invoice));
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    // Nota contabila la inregistrarea facturii primite:
    // DR 6xx  Cont cheltuiala    — subtotal (fara TVA)
    // DR 4426 TVA deductibila    — valoarea TVA
    // CR 401  Furnizori          — total (subtotal + TVA)
    private void postRegistrationJournalEntry(SupplierInvoice invoice, BigDecimal vatAmount, User user) {
        Account furnizori = accountRepository.findByCode("401")
                .orElseThrow(() -> new RuntimeException("Contul 401 (Furnizori) nu exista in planul de conturi"));

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .referenceNumber("SINV-" + invoice.getId() + "-" + invoice.getIssueDate())
                .entryDate(invoice.getIssueDate())
                .description("Factura furnizor " + invoice.getInvoiceNumber() + " - " + invoice.getSupplier().getName())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        // DR 6xx — cheltuiala (subtotal fara TVA)
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(invoice.getExpenseAccount())
                .debitAmount(invoice.getSubtotal())
                .creditAmount(BigDecimal.ZERO)
                .description("Cheltuiala: " + invoice.getSupplier().getName())
                .build());

        // DR 4426 — TVA deductibila (daca exista TVA)
        if (vatAmount.compareTo(BigDecimal.ZERO) > 0) {
            Account tvaDeductibila = accountRepository.findByCode("4426")
                    .orElseThrow(() -> new RuntimeException("Contul 4426 (TVA deductibila) nu exista in planul de conturi"));
            journalLineRepository.save(JournalLine.builder()
                    .journalEntry(savedEntry)
                    .account(tvaDeductibila)
                    .debitAmount(vatAmount)
                    .creditAmount(BigDecimal.ZERO)
                    .description("TVA deductibila " + invoice.getInvoiceNumber())
                    .build());
        }

        // CR 401 — Furnizori (total cu TVA)
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(furnizori)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(invoice.getTotal())
                .description("Datorie furnizor: " + invoice.getSupplier().getName())
                .build());

        invoice.setJournalEntry(savedEntry);
    }

    // Nota contabila la plata facturii furnizorului:
    // DR 401  Furnizori        — total platit
    // CR 5121 Conturi la banci — banii ies din banca
    private JournalEntry postPaymentJournalEntry(SupplierInvoice invoice, User user) {
        Account furnizori = accountRepository.findByCode("401")
                .orElseThrow(() -> new RuntimeException("Contul 401 (Furnizori) nu exista in planul de conturi"));
        Account banca = accountRepository.findByCode("5121")
                .orElseThrow(() -> new RuntimeException("Contul 5121 (Conturi la banci in lei) nu exista in planul de conturi"));

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .referenceNumber("PAY-" + invoice.getId() + "-" + LocalDate.now())
                .entryDate(LocalDate.now())
                .description("Plata factura " + invoice.getInvoiceNumber() + " - " + invoice.getSupplier().getName())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        // DR 401 — Furnizori (stingem datoria)
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(furnizori)
                .debitAmount(invoice.getTotal())
                .creditAmount(BigDecimal.ZERO)
                .description("Plata furnizor: " + invoice.getSupplier().getName())
                .build());

        // CR 5121 — Banca (banii ies)
        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(banca)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(invoice.getTotal())
                .description("Plata din banca: " + invoice.getInvoiceNumber())
                .build());

        invoice.setPaymentJournalEntry(savedEntry);
        return savedEntry;
    }

    // Creeaza o inregistrare in bank_operations astfel incat plata
    // sa apara vizibil in tab-ul Jurnal de Banca din pagina Bank
    private void createBankOperationForPayment(SupplierInvoice invoice, JournalEntry journalEntry, User user) {
        // Cauta primul cont bancar activ din sistem (indiferent de user)
        // deoarece contul bancar poate fi creat de un alt user (ex: admin)
        List<BankAccount> allBankAccounts = bankAccountRepository.findByIsActiveTrue();
        if (allBankAccounts.isEmpty()) {
            // Daca nu exista niciun cont bancar inregistrat, nota contabila exista oricum
            return;
        }

        BankAccount bankAccount = allBankAccounts.get(0);

        Account furnizori = accountRepository.findByCode("401")
                .orElseThrow(() -> new RuntimeException("Contul 401 nu exista"));
        Account banca = accountRepository.findByCode("5121")
                .orElseThrow(() -> new RuntimeException("Contul 5121 nu exista"));

        BankOperation operation = BankOperation.builder()
                .bankAccount(bankAccount)
                .user(user)
                .debitAccount(furnizori)
                .creditAccount(banca)
                .operationType(OperationType.SUPPLIER_PAYMENT)
                .description("Plata furnizor: " + invoice.getSupplier().getName() + " - " + invoice.getInvoiceNumber())
                .amount(invoice.getTotal())
                .operationDate(LocalDate.now())
                .journalEntry(journalEntry)
                .build();

        bankOperationRepository.save(operation);
    }

    private Supplier findSupplierById(Integer id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Furnizorul nu exista: " + id));
    }

    private SupplierInvoice findInvoiceById(Integer id) {
        return supplierInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura furnizor nu exista: " + id));
    }

    private SupplierResponse toSupplierResponse(Supplier s) {
        return new SupplierResponse(s.getId(), s.getName(), s.getEmail(), s.getPhone(),
                s.getAddress(), s.getTaxId(), s.getIsActive(), s.getCreatedAt());
    }

    private SupplierInvoiceResponse toInvoiceResponse(SupplierInvoice inv) {
        return new SupplierInvoiceResponse(
                inv.getId(),
                inv.getSupplier().getId(),
                inv.getSupplier().getName(),
                inv.getSupplier().getTaxId(),
                inv.getExpenseAccount().getId(),
                inv.getExpenseAccount().getCode(),
                inv.getExpenseAccount().getName(),
                inv.getTaxRate() != null ? inv.getTaxRate().getId() : null,
                inv.getTaxRate() != null ? inv.getTaxRate().getName() : null,
                inv.getTaxRate() != null ? inv.getTaxRate().getRate() : null,
                inv.getInvoiceNumber(),
                inv.getIssueDate(),
                inv.getDueDate(),
                inv.getSubtotal(),
                inv.getVatAmount(),
                inv.getTotal(),
                inv.getStatus().name(),
                inv.getNotes(),
                inv.getCreatedAt()
        );
    }
}