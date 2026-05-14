package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, Integer> {

    // Scoped to a specific bank account (company already implied via bank account)
    @Query("""
           SELECT bt FROM BankTransaction bt
           WHERE bt.bankAccount.id = :bankAccountId
           ORDER BY bt.transactionDate DESC
           """)
    List<BankTransaction> findByBankAccountId(@Param("bankAccountId") Integer bankAccountId);

    @Modifying
    @Query("DELETE FROM BankTransaction bt WHERE bt.bankAccount.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
    @Query("""
           SELECT bt FROM BankTransaction bt
           WHERE bt.bankAccount.id = :bankAccountId
             AND bt.reconciliationStatus = 'UNMATCHED'
           ORDER BY bt.transactionDate DESC
           """)
    List<BankTransaction> findUnmatchedByBankAccount(@Param("bankAccountId") Integer bankAccountId);
}