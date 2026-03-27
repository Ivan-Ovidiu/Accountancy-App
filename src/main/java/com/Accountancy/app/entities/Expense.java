package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "expenses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false) private Account account;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id") private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_rate_id") private TaxRate taxRate;

    @Column(length = 255) private String description;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(name = "expense_date", nullable = false) private LocalDate expenseDate;
    @Column(name = "receipt_url", length = 500) private String receiptUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) private ExpenseStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    public enum ExpenseStatus { PENDING, APPROVED, REJECTED }
}
