package com.Accountancy.app.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Pivot between users and companies. Acts as an access control list — a user
 * may operate on a company only if a row exists here for them.
 *
 * Note: stores user_id as a plain Integer (not @ManyToOne to User) to avoid
 * touching the User entity's existing relations.
 */
@Entity
@Table(
        name = "user_companies",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_companies",
                columnNames = {"user_id", "company_id"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /** True if this is the user's preselected company on login. */
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}