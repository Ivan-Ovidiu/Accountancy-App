package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "accounts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountType type;

    @Column(name = "sub_type", length = 50)
    private String subType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;


//OWNING SIDE RELATIONS:
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Account parent;

//INVERSE SIDE RELATIONS:
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    private List<Account> children;

    @OneToMany(mappedBy = "account", fetch = FetchType.LAZY)
    private List<JournalLine> journalLines;

    public enum AccountType {
        ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    }

    public boolean normalBalanceIsDebit() {
        return type == AccountType.ASSET || type == AccountType.EXPENSE;
    }
}
