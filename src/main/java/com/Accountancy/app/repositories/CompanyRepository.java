package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {

    Optional<Company> findByCode(String code);

    Optional<Company> findByTaxId(String taxId);

    boolean existsByCode(String code);

    boolean existsByTaxId(String taxId);

    List<Company> findByIsActiveTrueOrderByCodeAsc();

    List<Company> findByNameContainingIgnoreCase(String name);
}