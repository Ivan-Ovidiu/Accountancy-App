package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, Integer> {

    List<JournalLine> findByJournalEntryId(Integer journalEntryId);

    List<JournalLine> findByAccountId(Integer accountId);

    // Used by auto-match — finds journal lines on a specific date
    List<JournalLine> findByJournalEntryEntryDate(LocalDate entryDate);

    @Query("""
        SELECT COALESCE(SUM(jl.debitAmount), 0)
        FROM JournalLine jl
        JOIN jl.journalEntry je
        WHERE jl.account.id = :accountId
          AND je.status = 'POSTED'
          AND je.entryDate BETWEEN :from AND :to
    """)
    BigDecimal sumDebitsByAccountAndDateRange(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
        SELECT COALESCE(SUM(jl.creditAmount), 0)
        FROM JournalLine jl
        JOIN jl.journalEntry je
        WHERE jl.account.id = :accountId
          AND je.status = 'POSTED'
          AND je.entryDate BETWEEN :from AND :to
    """)
    BigDecimal sumCreditsByAccountAndDateRange(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}