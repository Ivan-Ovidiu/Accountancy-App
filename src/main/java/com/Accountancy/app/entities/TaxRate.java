package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tax_rates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaxRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50) private String name;
    @Column(nullable = false, precision = 5, scale = 2) private BigDecimal rate;
    @Column(nullable = false, length = 20) private String type;
    @Column(name = "is_default", nullable = false) private Boolean isDefault = false;
    @Column(name = "is_active",  nullable = false) private Boolean isActive  = true;

    // OWNING SIDE — tax rates are per-company (Romanian VAT rates are standard,
    // but each company needs its own copy so they can be deactivated/customized)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
}