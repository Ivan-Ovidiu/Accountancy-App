package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, Integer> {

    // ── Pentru P&L si Bilant — EXCLUDE notele CLOSE- ─────────────────────────
    // Evita dubla numarare: conturile 6xx/7xx ar aparea de 2 ori daca am include
    // si nota de inchidere care le crediteaza/debiteaza

    @Query("""
           SELECT COALESCE(SUM(jl.debitAmount), 0) FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.entryDate BETWEEN :from AND :to
             AND jl.journalEntry.company.id = :companyId
             AND jl.journalEntry.status = 'POSTED'
             AND jl.journalEntry.referenceNumber NOT LIKE 'CLOSE-%'
           """)
    BigDecimal sumDebitsByAccountAndDateRangeAndCompany(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("companyId") Integer companyId);

    @Query("""
           SELECT COALESCE(SUM(jl.creditAmount), 0) FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.entryDate BETWEEN :from AND :to
             AND jl.journalEntry.company.id = :companyId
             AND jl.journalEntry.status = 'POSTED'
             AND jl.journalEntry.referenceNumber NOT LIKE 'CLOSE-%'
           """)
    BigDecimal sumCreditsByAccountAndDateRangeAndCompany(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("companyId") Integer companyId);

    // ── Pentru Balanta si Fisa de cont — INCLUDE notele CLOSE- ───────────────
    // Utilizatorul vede toate miscarile inclusiv inchiderea lunii

    @Query("""
           SELECT COALESCE(SUM(jl.debitAmount), 0) FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.entryDate BETWEEN :from AND :to
             AND jl.journalEntry.company.id = :companyId
             AND jl.journalEntry.status = 'POSTED'
           """)
    BigDecimal sumDebitsByAccountAndDateRangeAndCompanyAll(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("companyId") Integer companyId);

    @Query("""
           SELECT COALESCE(SUM(jl.creditAmount), 0) FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.entryDate BETWEEN :from AND :to
             AND jl.journalEntry.company.id = :companyId
             AND jl.journalEntry.status = 'POSTED'
           """)
    BigDecimal sumCreditsByAccountAndDateRangeAndCompanyAll(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("companyId") Integer companyId);

    // ── Fisa de cont (Account Ledger) ─────────────────────────────────────────
    @Query("""
           SELECT jl FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.company.id = :companyId
           ORDER BY jl.journalEntry.entryDate ASC
           """)
    List<JournalLine> findByAccountIdAndCompanyId(
            @Param("accountId") Integer accountId,
            @Param("companyId") Integer companyId);

    // ── Reconciliere bancara ──────────────────────────────────────────────────
    @Query("""
           SELECT jl FROM JournalLine jl
           WHERE jl.journalEntry.entryDate = :date
             AND jl.journalEntry.company.id = :companyId
             AND jl.journalEntry.status = 'POSTED'
           """)
    List<JournalLine> findByJournalEntryEntryDateAndCompanyId(
            @Param("date") LocalDate date,
            @Param("companyId") Integer companyId);

    // ── Legacy ────────────────────────────────────────────────────────────────
    @Query("SELECT jl FROM JournalLine jl WHERE jl.account.id = :accountId")
    List<JournalLine> findByAccountId(@Param("accountId") Integer accountId);

    @Query("SELECT jl FROM JournalLine jl WHERE jl.journalEntry.entryDate = :date")
    List<JournalLine> findByJournalEntryEntryDate(@Param("date") LocalDate date);

    @Query("""
           SELECT COALESCE(SUM(jl.debitAmount), 0) FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.entryDate BETWEEN :from AND :to
           """)
    BigDecimal sumDebitsByAccountAndDateRange(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
           SELECT COALESCE(SUM(jl.creditAmount), 0) FROM JournalLine jl
           WHERE jl.account.id = :accountId
             AND jl.journalEntry.entryDate BETWEEN :from AND :to
           """)
    BigDecimal sumCreditsByAccountAndDateRange(
            @Param("accountId") Integer accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Modifying
    @Query("DELETE FROM JournalLine jl WHERE jl.journalEntry.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}