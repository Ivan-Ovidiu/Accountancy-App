package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Integer> {

    List<JournalEntry> findByCompany_IdOrderByEntryDateDesc(Integer companyId);

    List<JournalEntry> findByEntryDateBetweenAndCompany_Id(LocalDate from, LocalDate to, Integer companyId);

    Optional<JournalEntry> findByIdAndCompany_Id(Integer id, Integer companyId);

    Optional<JournalEntry> findByReferenceNumberAndCompany_Id(String referenceNumber, Integer companyId);

    List<JournalEntry> findByReferenceNumberStartingWith(String prefix);

    boolean existsByReferenceNumberAndCompany_Id(String referenceNumber, Integer companyId);

    // For ReportService (already has company via account filter, but useful for journal)
    List<JournalEntry> findByEntryDateBetween(LocalDate from, LocalDate to);
    @Modifying
    @Query("DELETE FROM JournalEntry je WHERE je.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}