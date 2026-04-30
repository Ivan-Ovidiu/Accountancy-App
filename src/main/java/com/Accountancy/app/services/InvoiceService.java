package com.Accountancy.app.services;

import com.Accountancy.app.dto.InvoiceDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.Invoice.InvoiceStatus;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.repositories.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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

    public InvoiceService(InvoiceRepository invoiceRepository,
                          ClientRepository clientRepository,
                          TaxRateRepository taxRateRepository,
                          AccountRepository accountRepository,
                          JournalEntryRepository journalEntryRepository,
                          JournalLineRepository journalLineRepository,
                          UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.taxRateRepository = taxRateRepository;
        this.accountRepository = accountRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
    }

    // GET all invoices
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET invoice by id
    public InvoiceResponse getInvoiceById(Integer id) {
        return toResponse(findById(id));
    }

    // GET invoices by client
    public List<InvoiceResponse> getInvoicesByClient(Integer clientId) {
        return invoiceRepository.findByClientId(clientId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET invoices by status
    public List<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status) {
        return invoiceRepository.findByStatus(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET overdue invoices (due date passed and not paid)
    public List<InvoiceResponse> getOverdueInvoices() {
        return invoiceRepository.findByDueDateBeforeAndStatusNot(LocalDate.now(), InvoiceStatus.PAID)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // POST — create invoice as DRAFT (no journal entry yet)
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new RuntimeException("Client not found: " + request.clientId()));

        TaxRate taxRate = taxRateRepository.findById(request.taxRateId())
                .orElseThrow(() -> new RuntimeException("Tax rate not found: " + request.taxRateId()));

        // Generate unique invoice number: INV-2024-00001
        String invoiceNumber = generateInvoiceNumber();

        // Build invoice items and calculate totals
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

            // Link to revenue account if provided
            if (itemRequest.accountId() != null) {
                Account account = accountRepository.findById(itemRequest.accountId())
                        .orElseThrow(() -> new RuntimeException("Account not found: " + itemRequest.accountId()));
                item.setAccount(account);
            }

            items.add(item);
            subtotal = subtotal.add(itemTotal);
        }

        // Calculate tax
        BigDecimal taxAmount = subtotal
                .multiply(taxRate.getRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal total = subtotal.add(taxAmount);

        // Get current logged-in user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Build invoice
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .client(client)
                .user(user)
                .taxRate(taxRate)
                .issueDate(request.issueDate())
                .dueDate(request.dueDate())
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .total(total)
                .status(InvoiceStatus.DRAFT)
                .notes(request.notes())
                .build();

        Invoice saved = invoiceRepository.save(invoice);

        // Link items to invoice and save
        items.forEach(item -> item.setInvoice(saved));
        saved.setItems(items);
        invoiceRepository.save(saved);

        return toResponse(saved);
    }

    // POST — send invoice (DRAFT → SENT) and post journal entry automatically
    @Transactional
    public InvoiceResponse sendInvoice(Integer id) {
        Invoice invoice = findById(id);

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT invoices can be sent");
        }

        // Post the accounting journal entry
        // DR Accounts Receivable (1100)  — we are owed money
        // CR Revenue accounts            — we earned revenue
        // CR VAT Payable (2100)          — we owe VAT to the state
        postInvoiceJournalEntry(invoice);

        invoice.setStatus(InvoiceStatus.SENT);
        return toResponse(invoiceRepository.save(invoice));
    }

    // POST — mark invoice as paid (SENT → PAID)
    @Transactional
    public InvoiceResponse markAsPaid(Integer id) {
        Invoice invoice = findById(id);

        if (invoice.getStatus() != InvoiceStatus.SENT && invoice.getStatus() != InvoiceStatus.OVERDUE) {
            throw new RuntimeException("Only SENT or OVERDUE invoices can be marked as paid");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        return toResponse(invoiceRepository.save(invoice));
    }

    // POST — void invoice
    @Transactional
    public InvoiceResponse voidInvoice(Integer id) {
        Invoice invoice = findById(id);

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new RuntimeException("Cannot void a paid invoice");
        }

        invoice.setStatus(InvoiceStatus.VOID);
        return toResponse(invoiceRepository.save(invoice));
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    // Posts the double-entry journal entry when invoice is sent
    private void postInvoiceJournalEntry(Invoice invoice) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        // Get required accounts from chart of accounts
        Account receivables = accountRepository.findByCode("1100")
                .orElseThrow(() -> new RuntimeException("Account 1100 (Accounts Receivable) not found in chart of accounts"));
        Account vatPayable = accountRepository.findByCode("2100")
                .orElseThrow(() -> new RuntimeException("Account 2100 (VAT Payable) not found in chart of accounts"));

        // Create journal entry
        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .referenceNumber("JE-" + invoice.getInvoiceNumber())
                .entryDate(invoice.getIssueDate())
                .description("Invoice " + invoice.getInvoiceNumber() + " - " + invoice.getClient().getName())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        List<JournalLine> lines = new ArrayList<>();

        // DR Accounts Receivable — full invoice total (subtotal + VAT)
        lines.add(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(receivables)
                .debitAmount(invoice.getTotal())
                .creditAmount(BigDecimal.ZERO)
                .description("Receivable: " + invoice.getClient().getName())
                .build());

        // CR Revenue accounts — one line per invoice item
        for (InvoiceItem item : invoice.getItems()) {
            Account revenueAccount = item.getAccount() != null
                    ? item.getAccount()
                    : accountRepository.findByCode("4000")
                    .orElseThrow(() -> new RuntimeException("Default revenue account 4000 not found"));

            lines.add(JournalLine.builder()
                    .journalEntry(savedEntry)
                    .account(revenueAccount)
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(item.getTotal())
                    .description(item.getDescription())
                    .build());
        }

        // CR VAT Payable — tax amount
        if (invoice.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            lines.add(JournalLine.builder()
                    .journalEntry(savedEntry)
                    .account(vatPayable)
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(invoice.getTaxAmount())
                    .description("VAT " + invoice.getTaxRate().getRate() + "% - " + invoice.getInvoiceNumber())
                    .build());
        }

        journalLineRepository.saveAll(lines);

        // Link journal entry to invoice
        invoice.setJournalEntry(savedEntry);
    }

    // Generates invoice number: INV-2026-00001
    // Foloseste count + retry loop ca sa evite duplicate key errors
    private String generateInvoiceNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "INV-" + year + "-";

        // Ia toate numerele existente pentru anul curent si gaseste urmatorul disponibil
        long count = invoiceRepository.findAll().stream()
                .filter(i -> i.getInvoiceNumber().startsWith(prefix))
                .count();

        // Incearca numere pana gaseste unul liber
        int candidate = (int) count + 1;
        while (true) {
            String number = prefix + String.format("%05d", candidate);
            if (invoiceRepository.findByInvoiceNumber(number).isEmpty()) {
                return number;
            }
            candidate++;
        }
    }

    private Invoice findById(Integer id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));
    }

    // Entity → DTO
    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems() == null
                ? List.of()
                : invoice.getItems().stream().map(item -> new InvoiceItemResponse(
                item.getId(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotal(),
                item.getAccount() != null ? item.getAccount().getId() : null,
                item.getAccount() != null ? item.getAccount().getName() : null
        )).toList();

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getClient().getId(),
                invoice.getClient().getName(),
                invoice.getClient().getTaxId(),
                invoice.getTaxRate() != null ? invoice.getTaxRate().getId() : null,
                invoice.getTaxRate() != null ? invoice.getTaxRate().getName() : null,
                invoice.getTaxRate() != null ? invoice.getTaxRate().getRate() : null,
                invoice.getIssueDate(),
                invoice.getDueDate(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getTotal(),
                invoice.getStatus(),
                invoice.getNotes(),
                invoice.getCreatedAt(),
                itemResponses
        );
    }
}