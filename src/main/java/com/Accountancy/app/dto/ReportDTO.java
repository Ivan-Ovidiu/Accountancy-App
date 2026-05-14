package com.Accountancy.app.dto;

import java.math.BigDecimal;
import java.util.List;

public class ReportDTO {

    // ── Existente ────────────────────────────────────────────────────────────

    public record ReportLineItem(String accountCode, String accountName, BigDecimal amount) {}

    public record ProfitAndLossResponse(
            String from, String to,
            List<ReportLineItem> revenueLines, BigDecimal totalRevenue,
            List<ReportLineItem> expenseLines, BigDecimal totalExpenses,
            BigDecimal netProfit
    ) {}

    public record BalanceSheetResponse(
            String asOf,
            List<ReportLineItem> assetLines, BigDecimal totalAssets,
            List<ReportLineItem> liabilityLines, BigDecimal totalLiabilities,
            List<ReportLineItem> equityLines, BigDecimal totalEquity,
            BigDecimal totalLiabilitiesAndEquity
    ) {}

    public record CashFlowResponse(
            String from, String to,
            BigDecimal totalInflows, BigDecimal totalOutflows, BigDecimal netCashFlow
    ) {}

    public record DashboardSummaryResponse(
            BigDecimal totalRevenue, BigDecimal totalExpenses, BigDecimal netProfit,
            BigDecimal outstandingInvoices, BigDecimal totalPaidInvoices, long pendingExpensesCount
    ) {}

    // ── Balanță contabilă ─────────────────────────────────────────────────────

    public record TrialBalanceLine(
            String accountCode, String accountName, String accountType,
            BigDecimal siDebit,  BigDecimal siCredit,   // Sold initial
            BigDecimal rdDebit,  BigDecimal rdCredit,   // Rulaje debit/credit
            BigDecimal sfDebit,  BigDecimal sfCredit    // Sold final
    ) {}

    // ── Fișă cont ─────────────────────────────────────────────────────────────

    public record AccountLedgerResponse(
            String accountCode, String accountName, String accountType,
            String from, String to,
            BigDecimal soldInitial,
            List<LedgerLine> lines,
            BigDecimal totalDebit, BigDecimal totalCredit,
            BigDecimal soldFinal
    ) {}

    public record LedgerLine(
            String date, String reference, String description,
            BigDecimal debit, BigDecimal credit, BigDecimal balance
    ) {}

    // ── Registru jurnal ───────────────────────────────────────────────────────

    public record GeneralJournalLine(
            String date, String reference, String description,
            String accountCode, String accountName,
            BigDecimal debit, BigDecimal credit
    ) {}

    // ── Jurnal vânzări ────────────────────────────────────────────────────────

    public record SalesJournalLine(
            String date, String invoiceNumber, String clientName, String clientTaxId,
            BigDecimal subtotal, BigDecimal vatAmount, BigDecimal total,
            String vatRate, String status
    ) {}

    // ── Jurnal cumpărări ──────────────────────────────────────────────────────

    public record PurchaseJournalLine(
            String date, String invoiceNumber, String supplierName, String supplierTaxId,
            String expenseAccountCode, String expenseAccountName,
            BigDecimal subtotal, BigDecimal vatAmount, BigDecimal total,
            String vatRate, String status
    ) {}

    // ── Situație clienți ──────────────────────────────────────────────────────

    public record ClientStatementLine(
            Integer clientId, String clientName, String clientTaxId,
            BigDecimal soldInitial, BigDecimal intrari,
            BigDecimal incasari, BigDecimal soldFinal
    ) {}

    // ── Situație furnizori ────────────────────────────────────────────────────

    public record SupplierStatementLine(
            Integer supplierId, String supplierName, String supplierTaxId,
            BigDecimal soldInitial, BigDecimal intrari,
            BigDecimal plati, BigDecimal soldFinal
    ) {}
}