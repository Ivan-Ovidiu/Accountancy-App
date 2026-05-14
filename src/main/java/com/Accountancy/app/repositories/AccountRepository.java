package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {

    List<Account> findByIsActiveTrue();

    List<Account> findByTypeAndIsActiveTrue(Account.AccountType type);

    List<Account> findByParentIsNullAndIsActiveTrue();

    List<Account> findByParentId(Integer parentId);

    Optional<Account> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);
}