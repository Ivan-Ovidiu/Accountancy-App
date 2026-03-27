package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByClientId(Integer clientId);
    List<Invoice> findByStatus(Invoice.InvoiceStatus status);
    List<Invoice> findByDueDateBeforeAndStatusNot(LocalDate date, Invoice.InvoiceStatus status);

    @Query("""
        SELECT COALESCE(SUM(i.total), 0)
        FROM Invoice i
        WHERE i.status = 'PAID'
          AND i.issueDate BETWEEN :from AND :to
    """)
    BigDecimal sumPaidInvoicesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT COALESCE(SUM(i.total), 0)
        FROM Invoice i
        WHERE i.status IN ('SENT', 'OVERDUE')
    """)
    BigDecimal sumOutstandingInvoices();
}