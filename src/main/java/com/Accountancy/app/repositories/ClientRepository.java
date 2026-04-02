package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {
    Optional<Client> findByEmail(String email);
    List<Client> findByIsActiveTrue();
    List<Client> findByNameContainingIgnoreCase(String name);
}