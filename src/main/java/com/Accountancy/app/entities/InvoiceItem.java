package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;



@Entity
@Table(name = "invoice_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false) private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id") private Account account;

    @Column(nullable = false, length = 255) private String description;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal quantity;
    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2) private BigDecimal unitPrice;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal total;
}
