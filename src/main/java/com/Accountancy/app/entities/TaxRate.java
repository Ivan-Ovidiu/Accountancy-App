package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tax_rates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaxRate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, length = 50) private String name;
    @Column(nullable = false, precision = 5, scale = 2) private BigDecimal rate;
    @Column(nullable = false, length = 20) private String type;
    @Column(name = "is_default", nullable = false) private Boolean isDefault = false;
    @Column(name = "is_active",  nullable = false) private Boolean isActive  = true;
}