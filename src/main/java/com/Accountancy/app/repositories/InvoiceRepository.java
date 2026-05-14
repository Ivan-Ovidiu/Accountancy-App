package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

    // ── Basic finders scoped to company ──────────────────────────

    List<Invoice> findByCompany_IdOrderByIssueDateDesc(Integer companyId);

    List<Invoice> findByClientIdAndCompany_Id(Integer clientId, Integer companyId);

    List<Invoice> findByStatusAndCompany_Id(Invoice.InvoiceStatus status, Integer companyId);

    Optional<Invoice> findByIdAndCompany_Id(Integer id, Integer companyId);

    Optional<Invoice> findByInvoiceNumberAndCompany_Id(String invoiceNumber, Integer companyId);

    // ── Overdue: VALIDATED sau OVERDUE cu due_date depășit ───────
    // Folosit atât pentru afișare cât și pentru check-overdue job
    @Query("""
           SELECT i FROM Invoice i
           WHERE i.company.id = :companyId
             AND i.status IN ('VALIDATED', 'OVERDUE')
             AND i.dueDate < :today
           """)
    List<Invoice> findOverdueByCompanyId(@Param("companyId") Integer companyId,
                                         @Param("today") LocalDate today);

    // ── Invoice number generation ─────────────────────────────────

    @Query("""
           SELECT COUNT(i) FROM Invoice i
           WHERE i.company.id = :companyId
             AND i.invoiceNumber LIKE :prefix%
           """)
    long countByCompanyIdAndInvoiceNumberStartingWith(@Param("companyId") Integer companyId,
                                                      @Param("prefix") String prefix);

    // ── Reports — only VALIDATED + PAID + OVERDUE appear ─────────
    // Facturile ISSUED și VOID nu apar în rapoarte
    @Query("""
           SELECT i FROM Invoice i
           WHERE i.company.id = :companyId
             AND i.issueDate >= :from AND i.issueDate <= :to
             AND i.status IN ('VALIDATED', 'PAID', 'OVERDUE')
           """)
    List<Invoice> findValidatedByCompanyIdAndIssueDateBetween(@Param("companyId") Integer companyId,
                                                              @Param("from") LocalDate from,
                                                              @Param("to") LocalDate to);

    // ── Dashboard — outstanding = VALIDATED + OVERDUE (nu ISSUED) ─
    @Query("""
           SELECT COALESCE(SUM(i.total), 0) FROM Invoice i
           WHERE i.company.id = :companyId
             AND i.status IN ('VALIDATED', 'OVERDUE')
           """)
    BigDecimal sumOutstandingByCompanyId(@Param("companyId") Integer companyId);

    // ── Client statement — toate non-void și non-issued pentru un client ──
    @Query("""
           SELECT i FROM Invoice i
           WHERE i.client.id = :clientId
             AND i.company.id = :companyId
             AND i.status NOT IN ('VOID', 'ISSUED')
           """)
    List<Invoice> findValidatedByClientIdAndCompany_Id(@Param("clientId") Integer clientId,
                                                       @Param("companyId") Integer companyId);

    // ── Internal / seeding use ────────────────────────────────────

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByClientId(Integer clientId);

    // ── Bulk operations for company reset ─────────────────────────

    @Modifying
    @Query("UPDATE Invoice i SET i.journalEntry = null WHERE i.company.id = :companyId")
    void nullifyJournalEntries(@Param("companyId") Integer companyId);

    @Modifying
    @Query("DELETE FROM InvoiceItem ii WHERE ii.invoice.id IN (SELECT i.id FROM Invoice i WHERE i.company.id = :companyId)")
    void deleteItemsByCompanyId(@Param("companyId") Integer companyId);

    @Modifying
    @Query("DELETE FROM Invoice i WHERE i.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}