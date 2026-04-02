package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.ReportDTO.*;
import com.Accountancy.app.services.ReportService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/reports/profit-and-loss?from=2026-01-01&to=2026-03-31
    @GetMapping("/profit-and-loss")
    public ResponseEntity<ProfitAndLossResponse> getProfitAndLoss(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getProfitAndLoss(from, to));
    }

    // GET /api/reports/balance-sheet?asOf=2026-03-31
    @GetMapping("/balance-sheet")
    public ResponseEntity<BalanceSheetResponse> getBalanceSheet(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf) {
        return ResponseEntity.ok(reportService.getBalanceSheet(asOf));
    }

    // GET /api/reports/cash-flow?from=2026-01-01&to=2026-03-31
    @GetMapping("/cash-flow")
    public ResponseEntity<CashFlowResponse> getCashFlow(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getCashFlow(from, to));
    }

    // GET /api/reports/dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }
}