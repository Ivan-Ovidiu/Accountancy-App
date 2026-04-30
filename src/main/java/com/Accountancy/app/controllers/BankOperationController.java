package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.BankOperationDTO.*;
import com.Accountancy.app.services.BankOperationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank-operations")
@SecurityRequirement(name = "bearerAuth")
public class BankOperationController {

    private final BankOperationService bankOperationService;

    public BankOperationController(BankOperationService bankOperationService) {
        this.bankOperationService = bankOperationService;
    }

    @GetMapping
    public ResponseEntity<List<BankOperationResponse>> getAll() {
        return ResponseEntity.ok(bankOperationService.getAll());
    }

    @GetMapping("/bank-account/{bankAccountId}")
    public ResponseEntity<List<BankOperationResponse>> getByBankAccount(@PathVariable Integer bankAccountId) {
        return ResponseEntity.ok(bankOperationService.getAllByBankAccount(bankAccountId));
    }

    // Creeaza operatiune si posteaza nota contabila automat
    @PostMapping
    public ResponseEntity<BankOperationResponse> createOperation(@RequestBody BankOperationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bankOperationService.createOperation(request));
    }
}