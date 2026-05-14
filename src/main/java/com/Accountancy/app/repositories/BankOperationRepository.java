package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.BankOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankOperationRepository extends JpaRepository<BankOperation, Integer> {

    @Query("""
           SELECT bo FROM BankOperation bo
           WHERE bo.bankAccount.id = :bankAccountId
           ORDER BY bo.operationDate DESC
           """)
    List<BankOperation> findByBankAccountId(@Param("bankAccountId") Integer bankAccountId);

    @Query("""
           SELECT bo FROM BankOperation bo
           WHERE bo.bankAccount.company.id = :companyId
           ORDER BY bo.operationDate DESC
           """)
    List<BankOperation> findAllByCompanyId(@Param("companyId") Integer companyId);

    // Folosit la delete factură — găsim operațiunea bancară legată de un journal entry
    Optional<BankOperation> findByJournalEntry_Id(Integer journalEntryId);

    // Găsim toate operațiunile legate de o factură după numărul ei în descriere
    @Query("""
           SELECT bo FROM BankOperation bo
           WHERE bo.bankAccount.company.id = :companyId
             AND bo.operationType = :opType
             AND bo.description LIKE :keyword
           """)
    List<BankOperation> findByCompanyIdAndTypeAndDescriptionContaining(
            @Param("companyId") Integer companyId,
            @Param("opType") BankOperation.OperationType opType,
            @Param("keyword") String keyword);

    @Modifying
    @Query("UPDATE BankOperation bo SET bo.journalEntry = null WHERE bo.journalEntry.id = :journalEntryId")
    void nullifyJournalEntry(@Param("journalEntryId") Integer journalEntryId);
}