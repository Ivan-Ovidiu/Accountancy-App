package com.Accountancy.app.services;

import com.Accountancy.app.dto.ReportDTO.*;
import com.Accountancy.app.entities.Account;
import com.Accountancy.app.entities.Account.AccountType;
import com.Accountancy.app.entities.Invoice;
import com.Accountancy.app.repositories.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final AccountRepository accountRepository;
    private final JournalLineRepository journalLineRepository;
    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;

    public ReportService(AccountRepository accountRepository,
                         JournalLineRepository journalLineRepository,
                         InvoiceRepository invoiceRepository,
                         ExpenseRepository expenseRepository) {
        this.accountRepository = accountRepository;
        this.journalLineRepository = journalLineRepository;
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
    }

    // ============================================================
    // PROFIT & LOSS
    // Shows revenue vs expenses for a given period
    // ============================================================
    public ProfitAndLossResponse getProfitAndLoss(LocalDate from, LocalDate to) {
        // Get all REVENUE accounts
        List<Account> revenueAccounts = accountRepository.findByType(AccountType.REVENUE);
        // Get all EXPENSE accounts
        List<Account> expenseAccounts = accountRepository.findByType(AccountType.EXPENSE);

        // For each revenue account, calculate net balance (credits - debits)
        // Revenue accounts increase with CREDIT
        List<ReportLineItem> revenueLines = revenueAccounts.stream()
                .map(account -> {
                    BigDecimal credits = journalLineRepository
                            .sumCreditsByAccountAndDateRange(account.getId(), from, to);
                    BigDecimal debits = journalLineRepository
                            .sumDebitsByAccountAndDateRange(account.getId(), from, to);
                    BigDecimal balance = credits.subtract(debits);
                    return new ReportLineItem(account.getCode(), account.getName(), balance);
                })
                .filter(line -> line.amount().compareTo(BigDecimal.ZERO) != 0)
                .collect(Collectors.toList());

        // For each expense account, calculate net balance (debits - credits)
        // Expense accounts increase with DEBIT
        List<ReportLineItem> expenseLines = expenseAccounts.stream()
                .map(account -> {
                    BigDecimal debits = journalLineRepository
                            .sumDebitsByAccountAndDateRange(account.getId(), from, to);
                    BigDecimal credits = journalLineRepository
                            .sumCreditsByAccountAndDateRange(account.getId(), from, to);
                    BigDecimal balance = debits.subtract(credits);
                    return new ReportLineItem(account.getCode(), account.getName(), balance);
                })
                .filter(line -> line.amount().compareTo(BigDecimal.ZERO) != 0)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = revenueLines.stream()
                .map(ReportLineItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenseLines.stream()
                .map(ReportLineItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = totalRevenue.subtract(totalExpenses);

        return new ProfitAndLossResponse(
                from.toString(),
                to.toString(),
                revenueLines,
                totalRevenue,
                expenseLines,
                totalExpenses,
                netProfit
        );
    }

    // ============================================================
    // BALANCE SHEET
    // Shows assets, liabilities and equity at a specific date
    // Assets = Liabilities + Equity (must always balance)
    // ============================================================
    public BalanceSheetResponse getBalanceSheet(LocalDate asOf) {
        // Balance sheet uses all history up to the given date
        LocalDate beginningOfTime = LocalDate.of(2000, 1, 1);

        List<Account> assetAccounts     = accountRepository.findByType(AccountType.ASSET);
        List<Account> liabilityAccounts = accountRepository.findByType(AccountType.LIABILITY);
        List<Account> equityAccounts    = accountRepository.findByType(AccountType.EQUITY);

        // Assets increase with DEBIT
        List<ReportLineItem> assetLines = assetAccounts.stream()
                .map(account -> {
                    BigDecimal debits  = journalLineRepository.sumDebitsByAccountAndDateRange(account.getId(), beginningOfTime, asOf);
                    BigDecimal credits = journalLineRepository.sumCreditsByAccountAndDateRange(account.getId(), beginningOfTime, asOf);
                    return new ReportLineItem(account.getCode(), account.getName(), debits.subtract(credits));
                })
                .filter(line -> line.amount().compareTo(BigDecimal.ZERO) != 0)
                .collect(Collectors.toList());

        // Liabilities increase with CREDIT
        List<ReportLineItem> liabilityLines = liabilityAccounts.stream()
                .map(account -> {
                    BigDecimal credits = journalLineRepository.sumCreditsByAccountAndDateRange(account.getId(), beginningOfTime, asOf);
                    BigDecimal debits  = journalLineRepository.sumDebitsByAccountAndDateRange(account.getId(), beginningOfTime, asOf);
                    return new ReportLineItem(account.getCode(), account.getName(), credits.subtract(debits));
                })
                .filter(line -> line.amount().compareTo(BigDecimal.ZERO) != 0)
                .collect(Collectors.toList());

        // Equity increases with CREDIT
        List<ReportLineItem> equityLines = equityAccounts.stream()
                .map(account -> {
                    BigDecimal credits = journalLineRepository.sumCreditsByAccountAndDateRange(account.getId(), beginningOfTime, asOf);
                    BigDecimal debits  = journalLineRepository.sumDebitsByAccountAndDateRange(account.getId(), beginningOfTime, asOf);
                    return new ReportLineItem(account.getCode(), account.getName(), credits.subtract(debits));
                })
                .filter(line -> line.amount().compareTo(BigDecimal.ZERO) != 0)
                .collect(Collectors.toList());

        BigDecimal totalAssets = assetLines.stream()
                .map(ReportLineItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLiabilities = liabilityLines.stream()
                .map(ReportLineItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEquity = equityLines.stream()
                .map(ReportLineItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BalanceSheetResponse(
                asOf.toString(),
                assetLines,
                totalAssets,
                liabilityLines,
                totalLiabilities,
                equityLines,
                totalEquity,
                totalLiabilities.add(totalEquity)
        );
    }

    // ============================================================
    // CASH FLOW
    // Shows money in vs money out for a period
    // Based on movements in bank/cash accounts
    // ============================================================
    public CashFlowResponse getCashFlow(LocalDate from, LocalDate to) {
        // Cash flow looks at ASSET accounts of type CURRENT_ASSET (cash and bank)
        List<Account> cashAccounts = accountRepository.findByType(AccountType.ASSET)
                .stream()
                .filter(a -> "CURRENT_ASSET".equals(a.getSubType()))
                .collect(Collectors.toList());

        BigDecimal totalInflows  = BigDecimal.ZERO;
        BigDecimal totalOutflows = BigDecimal.ZERO;

        for (Account account : cashAccounts) {
            BigDecimal debits  = journalLineRepository.sumDebitsByAccountAndDateRange(account.getId(), from, to);
            BigDecimal credits = journalLineRepository.sumCreditsByAccountAndDateRange(account.getId(), from, to);
            totalInflows  = totalInflows.add(debits);
            totalOutflows = totalOutflows.add(credits);
        }

        return new CashFlowResponse(
                from.toString(),
                to.toString(),
                totalInflows,
                totalOutflows,
                totalInflows.subtract(totalOutflows)
        );
    }

    // ============================================================
    // DASHBOARD SUMMARY
    // Quick numbers for the main dashboard
    // ============================================================
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate firstDayOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<Account> revenueAccounts = accountRepository.findByType(AccountType.REVENUE);
        List<Account> expenseAccounts = accountRepository.findByType(AccountType.EXPENSE);

        BigDecimal totalRevenue = revenueAccounts.stream()
                .map(a -> {
                    BigDecimal credits = journalLineRepository.sumCreditsByAccountAndDateRange(a.getId(), firstDayOfMonth, endOfMonth);
                    BigDecimal debits = journalLineRepository.sumDebitsByAccountAndDateRange(a.getId(), firstDayOfMonth, endOfMonth);
                    return credits.subtract(debits);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenseAccounts.stream()
                .map(a -> {
                    BigDecimal debits = journalLineRepository.sumDebitsByAccountAndDateRange(a.getId(), firstDayOfMonth, endOfMonth);
                    BigDecimal credits = journalLineRepository.sumCreditsByAccountAndDateRange(a.getId(), firstDayOfMonth, endOfMonth);
                    return debits.subtract(credits);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstanding = invoiceRepository.sumOutstandingInvoices();

        long pendingExpenses = expenseRepository
                .findByStatus(com.Accountancy.app.entities.Expense.ExpenseStatus.PENDING)
                .size();

        BigDecimal unpaidCount = invoiceRepository.sumOutstandingInvoices();

        return new DashboardSummaryResponse(
                totalRevenue,
                totalExpenses,
                totalRevenue.subtract(totalExpenses),
                outstanding,
                unpaidCount,
                pendingExpenses
        );
    }
}