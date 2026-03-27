package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "bank_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BankTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false) private BankAccount bankAccount;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_line_id") private JournalLine journalLine;

    @Column(name = "transaction_date", nullable = false) private LocalDate transactionDate;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(length = 255) private String description;
    @Column(length = 100) private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_status", nullable = false, length = 20)
    private ReconciliationStatus reconciliationStatus = ReconciliationStatus.UNMATCHED;

    @CreationTimestamp
    @Column(name = "imported_at", nullable = false, updatable = false) private LocalDateTime importedAt;

    public enum TransactionType        { DEBIT, CREDIT }
    public enum ReconciliationStatus   { UNMATCHED, MATCHED, MANUALLY_MATCHED, IGNORED }
}

