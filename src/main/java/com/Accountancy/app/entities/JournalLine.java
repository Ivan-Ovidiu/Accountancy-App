package com.Accountancy.app.entities;


import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "journal_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JournalLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "debit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal debitAmount = BigDecimal.ZERO;

    @Column(name = "credit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal creditAmount = BigDecimal.ZERO;

    @Column(length = 255)
    private String description;

    // Back-reference for bank reconciliation
    @OneToOne(mappedBy = "journalLine", fetch = FetchType.LAZY)
    private BankTransaction bankTransaction;

    // Convenience factory methods
    public static JournalLine debit(Account account, BigDecimal amount, String description) {
        return JournalLine.builder()
                .account(account)
                .debitAmount(amount)
                .creditAmount(BigDecimal.ZERO)
                .description(description)
                .build();
    }

    public static JournalLine credit(Account account, BigDecimal amount, String description) {
        return JournalLine.builder()
                .account(account)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(amount)
                .description(description)
                .build();
    }
}
