package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "invoices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_rate_id")
    private TaxRate taxRate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "issue_date", nullable = false) private LocalDate issueDate;
    @Column(name = "due_date",   nullable = false) private LocalDate dueDate;

    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal subtotal  = BigDecimal.ZERO;
    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2) private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal total     = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.ISSUED;

    @Column(length = 500) private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InvoiceItem> items;

    /**
     * ISSUED    — factura a fost creată și trimisă clientului; nu apare în rapoarte
     * VALIDATED — validată contabil; journal entry postat; apare în rapoarte
     * PAID      — încasată
     * OVERDUE   — validată, neîncasată, trecută de scadență
     * VOID      — anulată
     */
    public enum InvoiceStatus { ISSUED, VALIDATED, PAID, OVERDUE, VOID }
}