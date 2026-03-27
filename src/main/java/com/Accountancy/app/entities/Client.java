package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Client {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100) private String name;
    @Column(length = 100) private String email;
    @Column(length = 20)  private String phone;
    @Column(length = 255) private String address;
    @Column(name = "tax_id", length = 50) private String taxId;
    @Column(name = "is_active", nullable = false) private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

//Relations:
    @OneToMany(mappedBy = "client", fetch = FetchType.LAZY) private List<Invoice> invoices;
}
