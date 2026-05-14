package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    // Scoped to company — use these in services
    List<Expense> findByCompany_IdOrderByExpenseDateDesc(Integer companyId);

    List<Expense> findByStatusAndCompany_Id(Expense.ExpenseStatus status, Integer companyId);

    List<Expense> findByExpenseDateBetweenAndCompany_Id(LocalDate from, LocalDate to, Integer companyId);

    List<Expense> findByAccount_IdAndCompany_Id(Integer accountId, Integer companyId);

    Optional<Expense> findByIdAndCompany_Id(Integer id, Integer companyId);

    // Kept for internal use (ReportService dashboard pending count)
    List<Expense> findByStatus(Expense.ExpenseStatus status);
}