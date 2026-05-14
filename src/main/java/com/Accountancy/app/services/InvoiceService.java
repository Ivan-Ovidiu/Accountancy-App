package com.Accountancy.app.services;

import com.Accountancy.app.dto.InvoiceDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.Invoice.InvoiceStatus;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final TaxRateRepository taxRateRepository;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalLineRepository journalLineRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final BankOperationRepository bankOperationRepository;
    private final CompanyContext companyContext;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          ClientRepository clientRepository,
                          TaxRateRepository taxRateRepository,
                          AccountRepository accountRepository,
                          JournalEntryRepository journalEntryRepository,
                          JournalLineRepository journalLineRepository,
                          UserRepository userRepository,
                          CompanyRepository companyRepository,
                          BankOperationRepository bankOperationRepository,
                          CompanyContext companyContext) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.taxRateRepository = taxRateRepository;
        this.accountRepository = accountRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.bankOperationRepository = bankOperationRepository;
        this.companyContext = companyContext;
    }

    // ── Queries ──────────────────────────────────────────────────

    public List<InvoiceResponse> getAllInvoices() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return invoiceRepository.findByCompany_IdOrderByIssueDateDesc(companyId)
                .stream().map(this::toResponse).toList();
    }

    public InvoiceResponse getInvoiceById(Integer id) {
        return toResponse(findById(id));
    }

    public List<InvoiceResponse> getInvoicesByClient(Integer clientId) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return invoiceRepository.findByClientIdAndCompany_Id(clientId, companyId)
                .stream().map(this::toResponse).toList();
    }

    public List<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return invoiceRepository.findByStatusAndCompany_Id(status, companyId)
                .stream().map(this::toResponse).toList();
    }

    public List<InvoiceResponse> getOverdueInvoices() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return invoiceRepository.findOverdueByCompanyId(companyId, LocalDate.now())
                .stream().map(this::toResponse).toList();
    }

    // ── Create ───────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = findCompany(companyId);

        Client client = clientRepository.findByIdAndCompany_Id(request.clientId(), companyId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + request.clientId()));

        TaxRate taxRate = taxRateRepository.findByIdAndCompany_Id(request.taxRateId(), companyId)
                .orElseThrow(() -> new RuntimeException("Tax rate not found: " + request.taxRateId()));

        String invoiceNumber = generateInvoiceNumber(companyId);
        List<InvoiceItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (InvoiceItemRequest itemRequest : request.items()) {
            BigDecimal itemTotal = itemRequest.unitPrice()
                    .multiply(itemRequest.quantity())
                    .setScale(2, RoundingMode.HALF_UP);

            InvoiceItem item = InvoiceItem.builder()
                    .description(itemRequest.description())
                    .quantity(itemRequest.quantity())
                    .unitPrice(itemRequest.unitPrice())
                    .total(itemTotal)
                    .build();

            if (itemRequest.accountId() != null) {
                Account account = accountRepository.findById(itemRequest.accountId())
                        .orElseThrow(() -> new RuntimeException("Account not found: " + itemRequest.accountId()));
                item.setAccount(account);
            }

            items.add(item);
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal taxAmount = subtotal
                .multiply(taxRate.getRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .client(client)
                .user(user)
                .taxRate(taxRate)
                .company(company)
                .issueDate(request.issueDate())
                .dueDate(request.dueDate())
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .total(subtotal.add(taxAmount))
                .status(InvoiceStatus.ISSUED)
                .notes(request.notes())
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        items.forEach(item -> item.setInvoice(saved));
        saved.setItems(items);
        invoiceRepository.save(saved);

        return toResponse(saved);
    }

    // ── Transitions ──────────────────────────────────────────────

    @Transactional
    public InvoiceResponse validateInvoice(Integer id) {
        Invoice invoice = findById(id);
        if (invoice.getStatus() != InvoiceStatus.ISSUED) {
            throw new RuntimeException("Only ISSUED invoices can be validated. Current status: " + invoice.getStatus());
        }
        postInvoiceJournalEntry(invoice);
        invoice.setStatus(InvoiceStatus.VALIDATED);
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse markAsPaid(Integer id) {
        Invoice invoice = findById(id);
        if (invoice.getStatus() != InvoiceStatus.VALIDATED && invoice.getStatus() != InvoiceStatus.OVERDUE) {
            throw new RuntimeException("Only VALIDATED or OVERDUE invoices can be marked as paid. Current status: " + invoice.getStatus());
        }
        invoice.setStatus(InvoiceStatus.PAID);
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse voidInvoice(Integer id) {
        Invoice invoice = findById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new RuntimeException("Cannot void a paid invoice");
        }
        invoice.setStatus(InvoiceStatus.VOID);
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public int checkAndMarkOverdue() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        List<Invoice> candidates = invoiceRepository.findOverdueByCompanyId(companyId, LocalDate.now());
        List<Invoice> toUpdate = candidates.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.VALIDATED)
                .toList();
        toUpdate.forEach(i -> i.setStatus(InvoiceStatus.OVERDUE));
        invoiceRepository.saveAll(toUpdate);
        return toUpdate.size();
    }

    // ── Unvalidate ────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse unvalidateInvoice(Integer id) {
        Invoice invoice = findById(id);
        if (invoice.getStatus() != InvoiceStatus.VALIDATED) {
            throw new RuntimeException("Only VALIDATED invoices can be unvalidated. Current status: " + invoice.getStatus());
        }
        JournalEntry je = invoice.getJournalEntry();
        invoice.setJournalEntry(null);
        invoice.setStatus(InvoiceStatus.ISSUED);
        invoiceRepository.saveAndFlush(invoice);
        if (je != null) journalEntryRepository.deleteById(je.getId());
        return toResponse(invoiceRepository.findById(invoice.getId()).orElseThrow());
    }

    // ── Update ────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse updateInvoice(Integer id, InvoiceUpdateRequest request) {
        Invoice invoice = findById(id);
        if (invoice.getStatus() != InvoiceStatus.ISSUED) {
            throw new RuntimeException("Only ISSUED invoices can be edited. Current status: " + invoice.getStatus());
        }
        Integer companyId = companyContext.requireCurrentCompanyId();

        Client client = clientRepository.findByIdAndCompany_Id(request.clientId(), companyId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + request.clientId()));
        TaxRate taxRate = taxRateRepository.findByIdAndCompany_Id(request.taxRateId(), companyId)
                .orElseThrow(() -> new RuntimeException("Tax rate not found: " + request.taxRateId()));

        List<InvoiceItem> newItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (InvoiceItemRequest itemRequest : request.items()) {
            BigDecimal itemTotal = itemRequest.unitPrice()
                    .multiply(itemRequest.quantity())
                    .setScale(2, RoundingMode.HALF_UP);
            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .description(itemRequest.description())
                    .quantity(itemRequest.quantity())
                    .unitPrice(itemRequest.unitPrice())
                    .total(itemTotal)
                    .build();
            if (itemRequest.accountId() != null) {
                Account account = accountRepository.findById(itemRequest.accountId())
                        .orElseThrow(() -> new RuntimeException("Account not found: " + itemRequest.accountId()));
                item.setAccount(account);
            }
            newItems.add(item);
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal taxAmount = subtotal
                .multiply(taxRate.getRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        invoice.getItems().clear();
        invoiceRepository.saveAndFlush(invoice);

        invoice.setClient(client);
        invoice.setTaxRate(taxRate);
        invoice.setIssueDate(request.issueDate());
        invoice.setDueDate(request.dueDate());
        invoice.setNotes(request.notes());
        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotal(subtotal.add(taxAmount));
        invoice.getItems().addAll(newItems);

        return toResponse(invoiceRepository.save(invoice));
    }


    // ── Delete ────────────────────────────────────────────────────

    /**
     * Șterge o factură indiferent de status, respectând ordinea FK:
     *   PAID:              BankOperation (+ JE plată) → JE factură → Invoice
     *   VALIDATED/OVERDUE: JE factură → Invoice
     *   ISSUED/VOID:       Invoice direct
     */
    /**
     * Șterge o factură emisă respectând ordinea FK:
     *   PAID:              BankOperation (+ JE încasare) → JE factură → Invoice
     *   VALIDATED/OVERDUE: JE factură → Invoice
     *   ISSUED/VOID:       Invoice direct
     */
    @Transactional
    public void deleteInvoice(Integer id) {
        Invoice invoice = findById(id);

        // Pasul 1: dacă e PAID, găsim bank operation după JE și o ștergem
        if (invoice.getStatus() == InvoiceStatus.PAID && invoice.getJournalEntry() != null) {
            // JE de încasare e distinctă de JE de factură — o căutăm după referință BANK-*
            // care conține numărul facturii în descriere
            Integer companyId = companyContext.requireCurrentCompanyId();
            bankOperationRepository.findAllByCompanyId(companyId).stream()
                    .filter(op -> op.getOperationType() == BankOperation.OperationType.CLIENT_RECEIPT
                            && op.getDescription() != null
                            && op.getDescription().contains(invoice.getInvoiceNumber()))
                    .findFirst()
                    .ifPresent(op -> {
                        JournalEntry payJe = op.getJournalEntry();
                        op.setJournalEntry(null);
                        bankOperationRepository.save(op);
                        bankOperationRepository.delete(op);
                        if (payJe != null) journalEntryRepository.delete(payJe);
                    });
        }

        // Pasul 2: ștergem JE de înregistrare factură dacă există
        // cascade ALL pe lines — JournalLines se șterg automat
        if (invoice.getJournalEntry() != null) {
            JournalEntry je = invoice.getJournalEntry();
            invoice.setJournalEntry(null);
            invoiceRepository.save(invoice);
            journalEntryRepository.delete(je);
        }

        // Pasul 3: ștergem factura — cascade ALL pe items elimină și InvoiceItems
        invoiceRepository.delete(invoice);
    }

    // ── Journal Entry ─────────────────────────────────────────────

    private void postInvoiceJournalEntry(Invoice invoice) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Account receivables = accountRepository.findByCode("4111")
                .orElseThrow(() -> new RuntimeException("Account 4111 (Clienti) not found in chart of accounts"));
        Account vatPayable = accountRepository.findByCode("4427")
                .orElseThrow(() -> new RuntimeException("Account 4427 (TVA colectata) not found in chart of accounts"));

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .company(invoice.getCompany())
                .referenceNumber("JE-" + invoice.getInvoiceNumber())
                .entryDate(invoice.getIssueDate())
                .description("Invoice " + invoice.getInvoiceNumber() + " - " + invoice.getClient().getName())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);
        List<JournalLine> lines = new ArrayList<>();
        Company company = invoice.getCompany();

        lines.add(JournalLine.builder()
                .journalEntry(savedEntry).company(company).account(receivables)
                .debitAmount(invoice.getTotal()).creditAmount(BigDecimal.ZERO)
                .description("Clienti: " + invoice.getClient().getName())
                .build());

        for (InvoiceItem item : invoice.getItems()) {
            Account revenueAccount = item.getAccount() != null
                    ? item.getAccount()
                    : accountRepository.findByCode("704")
                    .orElseThrow(() -> new RuntimeException("Default revenue account 704 not found"));

            lines.add(JournalLine.builder()
                    .journalEntry(savedEntry).company(company).account(revenueAccount)
                    .debitAmount(BigDecimal.ZERO).creditAmount(item.getTotal())
                    .description(item.getDescription())
                    .build());
        }

        if (invoice.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            lines.add(JournalLine.builder()
                    .journalEntry(savedEntry).company(company).account(vatPayable)
                    .debitAmount(BigDecimal.ZERO).creditAmount(invoice.getTaxAmount())
                    .description("TVA " + invoice.getTaxRate().getRate() + "% - " + invoice.getInvoiceNumber())
                    .build());
        }

        journalLineRepository.saveAll(lines);
        invoice.setJournalEntry(savedEntry);
    }

    // ── Invoice Number Generation ─────────────────────────────────

    private String generateInvoiceNumber(Integer companyId) {
        String year   = String.valueOf(LocalDate.now().getYear());
        String prefix = "INV-" + year + "-";
        long count = invoiceRepository.countByCompanyIdAndInvoiceNumberStartingWith(companyId, prefix);
        int candidate = (int) count + 1;
        while (true) {
            String number = prefix + String.format("%05d", candidate);
            if (invoiceRepository.findByInvoiceNumberAndCompany_Id(number, companyId).isEmpty()) return number;
            candidate++;
        }
    }

    // ── Private Helpers ───────────────────────────────────────────

    private Invoice findById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return invoiceRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));
    }

    private Company findCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems() == null
                ? List.of()
                : invoice.getItems().stream().map(item -> new InvoiceItemResponse(
                item.getId(), item.getDescription(), item.getQuantity(), item.getUnitPrice(), item.getTotal(),
                item.getAccount() != null ? item.getAccount().getId() : null,
                item.getAccount() != null ? item.getAccount().getName() : null
        )).toList();

        return new InvoiceResponse(
                invoice.getId(), invoice.getInvoiceNumber(),
                invoice.getClient().getId(), invoice.getClient().getName(), invoice.getClient().getTaxId(),
                invoice.getTaxRate() != null ? invoice.getTaxRate().getId() : null,
                invoice.getTaxRate() != null ? invoice.getTaxRate().getName() : null,
                invoice.getTaxRate() != null ? invoice.getTaxRate().getRate() : null,
                invoice.getIssueDate(), invoice.getDueDate(),
                invoice.getSubtotal(), invoice.getTaxAmount(), invoice.getTotal(),
                invoice.getStatus(), invoice.getNotes(), invoice.getCreatedAt(),
                itemResponses
        );
    }
}