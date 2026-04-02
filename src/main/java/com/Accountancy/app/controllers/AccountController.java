package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.AccountDTO.AccountRequest;
import com.Accountancy.app.dto.AccountDTO.AccountResponse;
import com.Accountancy.app.entities.Account.AccountType;
import com.Accountancy.app.services.AccountService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // GET /api/accounts
    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    // GET /api/accounts/roots  — only top-level accounts
    @GetMapping("/roots")
    public ResponseEntity<List<AccountResponse>> getRootAccounts() {
        return ResponseEntity.ok(accountService.getRootAccounts());
    }

    // GET /api/accounts/type/EXPENSE
    @GetMapping("/type/{type}")
    public ResponseEntity<List<AccountResponse>> getAccountsByType(@PathVariable AccountType type) {
        return ResponseEntity.ok(accountService.getAccountsByType(type));
    }

    // GET /api/accounts/{id}/children
    @GetMapping("/{id}/children")
    public ResponseEntity<List<AccountResponse>> getChildAccounts(@PathVariable Integer id) {
        return ResponseEntity.ok(accountService.getChildAccounts(id));
    }

    // GET /api/accounts/{id}
    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccountById(@PathVariable Integer id) {
        return ResponseEntity.ok(accountService.getAccountById(id));
    }

    // GET /api/accounts/code/5200
    @GetMapping("/code/{code}")
    public ResponseEntity<AccountResponse> getAccountByCode(@PathVariable String code) {
        return ResponseEntity.ok(accountService.getAccountByCode(code));
    }

    // POST /api/accounts
    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@RequestBody AccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.createAccount(request));
    }

    // PUT /api/accounts/{id}
    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(@PathVariable Integer id,
                                                         @RequestBody AccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(id, request));
    }

    // DELETE /api/accounts/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateAccount(@PathVariable Integer id) {
        accountService.deactivateAccount(id);
        return ResponseEntity.noContent().build();
    }
}