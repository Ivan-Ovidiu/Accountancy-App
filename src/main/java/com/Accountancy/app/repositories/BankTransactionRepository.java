package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;


@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, Integer> {
    List<BankTransaction> findByBankAccountId(Integer bankAccountId);
    List<BankTransaction> findByReconciliationStatus(BankTransaction.ReconciliationStatus status);
    List<BankTransaction> findByTransactionDateBetween(LocalDate from, LocalDate to);

    @Query("""
        SELECT bt FROM BankTransaction bt
        WHERE bt.bankAccount.id = :bankAccountId
          AND bt.reconciliationStatus = 'UNMATCHED'
        ORDER BY bt.transactionDate DESC
    """)
    List<BankTransaction> findUnmatchedByBankAccount(@Param("bankAccountId") Integer bankAccountId);
}