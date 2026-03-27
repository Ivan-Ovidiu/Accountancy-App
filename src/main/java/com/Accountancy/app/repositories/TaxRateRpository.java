package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface TaxRateRepository extends JpaRepository<TaxRate, Integer> {
    Optional<TaxRate> findByIsDefaultTrue();
    List<TaxRate> findByIsActiveTrue();
}