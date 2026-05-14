package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    // Scoped to company — use these in services
    List<Client> findByIsActiveTrueAndCompany_Id(Integer companyId);

    List<Client> findByNameContainingIgnoreCaseAndCompany_Id(String name, Integer companyId);

    // Secure single-fetch — returns empty if client doesn't belong to this company
    Optional<Client> findByIdAndCompany_Id(Integer id, Integer companyId);

    Optional<Client> findByEmailAndCompany_Id(String email, Integer companyId);

    // Kept for internal use (e.g. seeding, migrations) — never expose to API
    Optional<Client> findByEmail(String email);
    @Modifying
    @Query("DELETE FROM Client c WHERE c.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}