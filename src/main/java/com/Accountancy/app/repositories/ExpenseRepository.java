package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
interface ExpenseRepository extends JpaRepository<Expense, Integer> {
    List<Expense> findByUserId(Integer userId);
    List<Expense> findByStatus(Expense.ExpenseStatus status);
    List<Expense> findByExpenseDateBetween(LocalDate from, LocalDate to);
    List<Expense> findByAccountId(Integer accountId);

    @Query("""
        SELECT COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.status = 'APPROVED'
          AND e.expenseDate BETWEEN :from AND :to
    """)
    BigDecimal sumApprovedExpensesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}