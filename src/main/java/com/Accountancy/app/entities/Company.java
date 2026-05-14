package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** SAGA-style internal code: "0001", "0003". Unique. */
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    /** CIF / CUI — Romanian fiscal identifier, e.g. "RO34314954". */
    @Column(name = "tax_id", nullable = false, unique = true, length = 20)
    private String taxId;

    @Column(name = "trade_register_no", length = 30)
    private String tradeRegisterNo;

    @Column(name = "caen_code", length = 10)
    private String caenCode;

    @Column(name = "share_capital", precision = 18, scale = 2)
    private BigDecimal shareCapital;

    // Sediu social
    @Column(name = "address_county",      length = 50)  private String addressCounty;
    @Column(name = "address_city",        length = 100) private String addressCity;
    @Column(name = "address_street",      length = 200) private String addressStreet;
    @Column(name = "address_number",      length = 20)  private String addressNumber;
    @Column(name = "address_block",       length = 20)  private String addressBlock;
    @Column(name = "address_entrance",    length = 10)  private String addressEntrance;
    @Column(name = "address_floor",       length = 10)  private String addressFloor;
    @Column(name = "address_apartment",   length = 10)  private String addressApartment;
    @Column(name = "address_sector",      length = 10)  private String addressSector;
    @Column(name = "address_postal_code", length = 20)  private String addressPostalCode;

    @Column(length = 30)  private String phone;
    @Column(length = 100) private String email;

    @Column(name = "primary_bank_iban", length = 40)  private String primaryBankIban;
    @Column(name = "primary_bank_name", length = 100) private String primaryBankName;

    /** Plătitor de TVA. */
    @Column(name = "vat_payer", nullable = false)
    private Boolean vatPayer;

    /** MONTHLY | QUARTERLY | NONE */
    @Enumerated(EnumType.STRING)
    @Column(name = "vat_period", nullable = false, length = 20)
    private VatPeriod vatPeriod;

    /** TVA la încasare. */
    @Column(name = "vat_on_collection", nullable = false)
    private Boolean vatOnCollection;

    /** PROFIT | MICRO */
    @Enumerated(EnumType.STRING)
    @Column(name = "profit_tax_type", nullable = false, length = 20)
    private ProfitTaxType profitTaxType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum VatPeriod      { MONTHLY, QUARTERLY, NONE }
    public enum ProfitTaxType  { PROFIT, MICRO }
}