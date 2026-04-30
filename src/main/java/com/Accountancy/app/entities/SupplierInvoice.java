package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_invoices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SupplierInvoice {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Furnizorul de la care am primit factura
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    // Userul care a inregistrat factura
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Contul de cheltuiala (6xx) ales de user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_account_id", nullable = false)
    private Account expenseAccount;

    // Cota TVA aplicata
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_rate_id")
    private TaxRate taxRate;

    // Nota contabila la inregistrare: 6xx + 4426 = 401
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    // Nota contabila la plata: 401 = 5121
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_journal_entry_id")
    private JournalEntry paymentJournalEntry;

    // Numarul facturii de la furnizor (ex: FA-2026-001)
    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "issue_date", nullable = false) private LocalDate issueDate;
    @Column(name = "due_date",   nullable = false) private LocalDate dueDate;

    @Column(precision = 18, scale = 2) private BigDecimal subtotal  = BigDecimal.ZERO;
    @Column(name = "vat_amount", precision = 18, scale = 2) private BigDecimal vatAmount = BigDecimal.ZERO;
    @Column(precision = 18, scale = 2) private BigDecimal total     = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupplierInvoiceStatus status = SupplierInvoiceStatus.PENDING;

    @Column(length = 500) private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum SupplierInvoiceStatus { PENDING, PAID, OVERDUE, VOID }
}