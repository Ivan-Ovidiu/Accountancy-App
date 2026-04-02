package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.BankDTO.*;
import com.Accountancy.app.services.BankAccountService;
import com.Accountancy.app.services.BankReconciliationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/bank")
@SecurityRequirement(name = "bearerAuth")
public class BankController {

    private final BankAccountService bankAccountService;
    private final BankReconciliationService reconciliationService;

    public BankController(BankAccountService bankAccountService,
                          BankReconciliationService reconciliationService) {
        this.bankAccountService = bankAccountService;
        this.reconciliationService = reconciliationService;
    }

    // ============================================================
    // BANK ACCOUNTS
    // ============================================================

    // GET /api/bank/accounts
    @GetMapping("/accounts")
    public ResponseEntity<List<BankAccountResponse>> getAllBankAccounts() {
        return ResponseEntity.ok(bankAccountService.getAllBankAccounts());
    }

    // GET /api/bank/accounts/{id}
    @GetMapping("/accounts/{id}")
    public ResponseEntity<BankAccountResponse> getBankAccountById(@PathVariable Integer id) {
        return ResponseEntity.ok(bankAccountService.getBankAccountById(id));
    }

    // POST /api/bank/accounts
    @PostMapping("/accounts")
    public ResponseEntity<BankAccountResponse> createBankAccount(@RequestBody BankAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bankAccountService.createBankAccount(request));
    }

    // DELETE /api/bank/accounts/{id}
    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> deactivateBankAccount(@PathVariable Integer id) {
        bankAccountService.deactivateBankAccount(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // TRANSACTIONS
    // ============================================================

    // GET /api/bank/accounts/{bankAccountId}/transactions
    @GetMapping("/accounts/{bankAccountId}/transactions")
    public ResponseEntity<List<BankTransactionResponse>> getTransactions(
            @PathVariable Integer bankAccountId) {
        return ResponseEntity.ok(reconciliationService.getTransactionsByBankAccount(bankAccountId));
    }

    // GET /api/bank/accounts/{bankAccountId}/transactions/unmatched
    @GetMapping("/accounts/{bankAccountId}/transactions/unmatched")
    public ResponseEntity<List<BankTransactionResponse>> getUnmatchedTransactions(
            @PathVariable Integer bankAccountId) {
        return ResponseEntity.ok(reconciliationService.getUnmatchedTransactions(bankAccountId));
    }

    // ============================================================
    // CSV IMPORT
    // POST /api/bank/accounts/{bankAccountId}/import
    // multipart/form-data with file field named "file"
    // ============================================================
    @PostMapping(value = "/accounts/{bankAccountId}/import",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CsvImportResult> importCsv(
            @PathVariable Integer bankAccountId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(reconciliationService.importCsv(bankAccountId, file));
    }

    // ============================================================
    // RECONCILIATION
    // ============================================================

    // POST /api/bank/match  — manual match
    @PostMapping("/match")
    public ResponseEntity<BankTransactionResponse> manualMatch(@RequestBody ManualMatchRequest request) {
        return ResponseEntity.ok(reconciliationService.manualMatch(request));
    }

    // POST /api/bank/transactions/{id}/unmatch  — revert match
    @PostMapping("/transactions/{id}/unmatch")
    public ResponseEntity<BankTransactionResponse> unmatch(@PathVariable Integer id) {
        return ResponseEntity.ok(reconciliationService.unmatch(id));
    }

    // POST /api/bank/accounts/{bankAccountId}/auto-match  — trigger auto match manually
    @PostMapping("/accounts/{bankAccountId}/auto-match")
    public ResponseEntity<Void> autoMatch(@PathVariable Integer bankAccountId) {
        reconciliationService.autoMatch(bankAccountId);
        return ResponseEntity.ok().build();
    }
}