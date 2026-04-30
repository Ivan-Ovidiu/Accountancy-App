package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.BankOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BankOperationRepository extends JpaRepository<BankOperation, Integer> {
    List<BankOperation> findByBankAccountId(Integer bankAccountId);
    List<BankOperation> findByOperationDateBetween(LocalDate from, LocalDate to);
    List<BankOperation> findByBankAccountIdAndOperationDateBetween(Integer bankAccountId, LocalDate from, LocalDate to);
}