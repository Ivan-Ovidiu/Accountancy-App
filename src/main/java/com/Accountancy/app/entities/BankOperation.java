package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_operations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BankOperation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debit_account_id", nullable = false)
    private Account debitAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_account_id", nullable = false)
    private Account creditAccount;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, length = 30)
    private OperationType operationType = OperationType.OTHER;

    @Column(nullable = false, length = 255) private String description;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(name = "operation_date", nullable = false) private LocalDate operationDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum OperationType {
        COMMISSION,       // Comision bancar:  627 = 5121
        SUPPLIER_PAYMENT, // Plata furnizor:   401 = 5121
        CLIENT_RECEIPT,   // Incasare client:  5121 = 4111
        INTEREST_EXP,     // Dobanda platita:  666 = 5121
        INTEREST_INC,     // Dobanda incasata: 5121 = 766
        OTHER             // Alta operatiune:  DR ales = CR ales
    }
}