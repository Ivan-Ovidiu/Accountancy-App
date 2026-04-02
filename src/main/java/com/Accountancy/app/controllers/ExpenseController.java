package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.ExpenseDTO.ExpenseRequest;
import com.Accountancy.app.dto.ExpenseDTO.ExpenseResponse;
import com.Accountancy.app.entities.Expense.ExpenseStatus;
import com.Accountancy.app.services.ExpenseService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    // GET /api/expenses
    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    // GET /api/expenses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(@PathVariable Integer id) {
        return ResponseEntity.ok(expenseService.getExpenseById(id));
    }

    // GET /api/expenses/status/PENDING
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByStatus(@PathVariable ExpenseStatus status) {
        return ResponseEntity.ok(expenseService.getExpensesByStatus(status));
    }

    // GET /api/expenses/range?from=2026-01-01&to=2026-03-31
    @GetMapping("/range")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(expenseService.getExpensesByDateRange(from, to));
    }

    // GET /api/expenses/account/{accountId}
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByAccount(@PathVariable Integer accountId) {
        return ResponseEntity.ok(expenseService.getExpensesByAccount(accountId));
    }

    // POST /api/expenses  — creates expense as PENDING
    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@RequestBody ExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expenseService.createExpense(request));
    }

    // POST /api/expenses/{id}/approve  — PENDING → APPROVED + posts journal entry
    @PostMapping("/{id}/approve")
    public ResponseEntity<ExpenseResponse> approveExpense(@PathVariable Integer id) {
        return ResponseEntity.ok(expenseService.approveExpense(id));
    }

    // POST /api/expenses/{id}/reject  — PENDING → REJECTED
    @PostMapping("/{id}/reject")
    public ResponseEntity<ExpenseResponse> rejectExpense(@PathVariable Integer id) {
        return ResponseEntity.ok(expenseService.rejectExpense(id));
    }
}