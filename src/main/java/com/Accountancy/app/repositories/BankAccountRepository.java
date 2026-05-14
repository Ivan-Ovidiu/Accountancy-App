package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Integer> {

    List<BankAccount> findByIsActiveTrueAndCompany_Id(Integer companyId);

    Optional<BankAccount> findByIdAndCompany_Id(Integer id, Integer companyId);

    // Kept for BankAccountService.findById() used internally by BankReconciliationService
    // — already verifies company in the calling service
    List<BankAccount> findByIsActiveTrue();
    @Modifying
    @Query("DELETE FROM BankAccount ba WHERE ba.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}