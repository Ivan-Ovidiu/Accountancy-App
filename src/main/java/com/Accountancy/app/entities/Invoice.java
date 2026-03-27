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

//OWNING SIDE RELATIONS:
//An invoice belongs to one client
//An invoice is created by one user
//An invoice has one journalEntry
//An invoice has one taxRate
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false) private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id") private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_rate_id") private TaxRate taxRate;

 //Attributes:
    @Column(name = "invoice_number", nullable = false, unique = true, length = 50) private String invoiceNumber;
    @Column(name = "issue_date", nullable = false) private LocalDate issueDate;
    @Column(name = "due_date",   nullable = false) private LocalDate dueDate;
    @Column(precision = 18, scale = 2) private BigDecimal subtotal  = BigDecimal.ZERO;
    @Column(name = "tax_amount", precision = 18, scale = 2) private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(precision = 18, scale = 2) private BigDecimal total     = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) private InvoiceStatus status;

    @Column(length = 500) private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

//INVERSE SIDE RELATIONS:
//An invoice belongs to more invoice items
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items;

    public enum InvoiceStatus { DRAFT, SENT, PAID, OVERDUE, VOID }
}
