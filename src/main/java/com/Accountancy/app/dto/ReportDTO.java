package com.Accountancy.app.dto;

import java.math.BigDecimal;
import java.util.List;

public class ReportDTO {

    // Single line in a report (e.g. "Rent Expense — 500.00 RON")
    public record ReportLineItem(
            String accountCode,
            String accountName,
            BigDecimal amount
    ) {}

    // Profit & Loss Statement
    public record ProfitAndLossResponse(
            String periodFrom,
            String periodTo,
            List<ReportLineItem> revenueLines,
            BigDecimal totalRevenue,
            List<ReportLineItem> expenseLines,
            BigDecimal totalExpenses,
            BigDecimal netProfit
    ) {}

    // Balance Sheet
    public record BalanceSheetResponse(
            String asOfDate,
            List<ReportLineItem> assetLines,
            BigDecimal totalAssets,
            List<ReportLineItem> liabilityLines,
            BigDecimal totalLiabilities,
            List<ReportLineItem> equityLines,
            BigDecimal totalEquity,
            BigDecimal totalLiabilitiesAndEquity
    ) {}

    // Cash Flow summary
    public record CashFlowResponse(
            String periodFrom,
            String periodTo,
            BigDecimal totalInflows,
            BigDecimal totalOutflows,
            BigDecimal netCashFlow
    ) {}

    // Dashboard summary — shown on the main dashboard
    public record DashboardSummaryResponse(
            BigDecimal totalRevenue,
            BigDecimal totalExpenses,
            BigDecimal netProfit,
            BigDecimal outstandingInvoices,
            BigDecimal totalPaidInvoices,
            long pendingExpensesCount
    ) {}
}