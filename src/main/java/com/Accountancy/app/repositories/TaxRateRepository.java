package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, Integer> {

    // Scoped to company
    List<TaxRate> findByIsActiveTrueAndCompany_Id(Integer companyId);

    Optional<TaxRate> findByIsDefaultTrueAndCompany_Id(Integer companyId);

    // Secure single-fetch
    Optional<TaxRate> findByIdAndCompany_Id(Integer id, Integer companyId);

    // Kept for internal use (seeding)
    Optional<TaxRate> findByIsDefaultTrue();
    @Modifying
    @Query("DELETE FROM TaxRate t WHERE t.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}