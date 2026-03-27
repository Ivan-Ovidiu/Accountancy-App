package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByCode(String code);
    List<Account> findByType(Account.AccountType type);
    List<Account> findByParentIsNull();           // root accounts only
    List<Account> findByParentId(Integer parentId);
    List<Account> findByIsActiveTrue();
}
