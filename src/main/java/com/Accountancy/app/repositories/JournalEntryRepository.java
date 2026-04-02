package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Integer> {
    Optional<JournalEntry> findByReferenceNumber(String referenceNumber);
    List<JournalEntry> findByStatus(JournalEntry.JournalStatus status);
    List<JournalEntry> findByEntryDateBetween(LocalDate from, LocalDate to);

    // Used to generate the next reference number
    @Query("SELECT MAX(j.referenceNumber) FROM JournalEntry j WHERE j.referenceNumber LIKE :prefix%")
    Optional<String> findMaxReferenceNumberByPrefix(@Param("prefix") String prefix);
}