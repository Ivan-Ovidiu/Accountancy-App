package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "bank_accounts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BankAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id") private Account account;

    @Column(name = "bank_name",      nullable = false, length = 100) private String bankName;
    @Column(name = "account_number", nullable = false, length = 50)  private String accountNumber;
    @Column(name = "account_name",   nullable = false, length = 150) private String accountName;
    @Column(name = "current_balance", nullable = false, precision = 18, scale = 2) private BigDecimal currentBalance = BigDecimal.ZERO;
    @Column(nullable = false, length = 3) private String currency = "RON";
    @Column(name = "is_active", nullable = false) private Boolean isActive = true;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @OneToMany(mappedBy = "bankAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BankTransaction> transactions;
}
