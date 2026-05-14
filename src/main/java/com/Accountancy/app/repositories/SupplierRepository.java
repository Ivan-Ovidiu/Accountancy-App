package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {

    List<Supplier> findByIsActiveTrueAndCompany_Id(Integer companyId);

    List<Supplier> findByNameContainingIgnoreCaseAndCompany_Id(String name, Integer companyId);

    Optional<Supplier> findByIdAndCompany_Id(Integer id, Integer companyId);

    // For seeding/migrations only
    List<Supplier> findAll();
}