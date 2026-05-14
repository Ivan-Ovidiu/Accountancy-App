package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.ReportDTO.*;
import com.Accountancy.app.services.ReportService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // ── Existente ────────────────────────────────────────────────────────────

    @GetMapping("/profit-and-loss")
    public ResponseEntity<ProfitAndLossResponse> getProfitAndLoss(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getProfitAndLoss(from, to));
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<BalanceSheetResponse> getBalanceSheet(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf) {
        return ResponseEntity.ok(reportService.getBalanceSheet(asOf));
    }

    @GetMapping("/cash-flow")
    public ResponseEntity<CashFlowResponse> getCashFlow(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getCashFlow(from, to));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }

    // ── Balanță contabilă ─────────────────────────────────────────────────────
    // GET /api/reports/trial-balance?from=2026-01-01&to=2026-12-31
    @GetMapping("/trial-balance")
    public ResponseEntity<List<TrialBalanceLine>> getTrialBalance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getTrialBalance(from, to));
    }

    // ── Fișă cont ─────────────────────────────────────────────────────────────
    // GET /api/reports/account-ledger/{accountId}?from=...&to=...
    @GetMapping("/account-ledger/{accountId}")
    public ResponseEntity<AccountLedgerResponse> getAccountLedger(
            @PathVariable Integer accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getAccountLedger(accountId, from, to));
    }

    // ── Registru jurnal ───────────────────────────────────────────────────────
    // GET /api/reports/general-journal?from=...&to=...
    @GetMapping("/general-journal")
    public ResponseEntity<List<GeneralJournalLine>> getGeneralJournal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getGeneralJournal(from, to));
    }

    // ── Jurnal vânzări ────────────────────────────────────────────────────────
    // GET /api/reports/sales-journal?from=...&to=...
    @GetMapping("/sales-journal")
    public ResponseEntity<List<SalesJournalLine>> getSalesJournal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getSalesJournal(from, to));
    }

    // ── Jurnal cumpărări ──────────────────────────────────────────────────────
    // GET /api/reports/purchase-journal?from=...&to=...
    @GetMapping("/purchase-journal")
    public ResponseEntity<List<PurchaseJournalLine>> getPurchaseJournal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getPurchaseJournal(from, to));
    }

    // ── Situație clienți ──────────────────────────────────────────────────────
    // GET /api/reports/client-statement?from=...&to=...
    @GetMapping("/client-statement")
    public ResponseEntity<List<ClientStatementLine>> getClientStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getClientStatement(from, to));
    }

    // ── Situație furnizori ────────────────────────────────────────────────────
    // GET /api/reports/supplier-statement?from=...&to=...
    @GetMapping("/supplier-statement")
    public ResponseEntity<List<SupplierStatementLine>> getSupplierStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getSupplierStatement(from, to));
    }
}