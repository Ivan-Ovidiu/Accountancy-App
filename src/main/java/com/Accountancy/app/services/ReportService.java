package com.Accountancy.app.services;

import com.Accountancy.app.dto.ReportDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.Account.AccountType;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final AccountRepository          accountRepository;
    private final JournalLineRepository      journalLineRepository;
    private final JournalEntryRepository     journalEntryRepository;
    private final InvoiceRepository          invoiceRepository;
    private final ExpenseRepository          expenseRepository;
    private final ClientRepository           clientRepository;
    private final SupplierRepository         supplierRepository;
    private final SupplierInvoiceRepository  supplierInvoiceRepository;
    private final CompanyContext             companyContext;

    public ReportService(AccountRepository accountRepository,
                         JournalLineRepository journalLineRepository,
                         JournalEntryRepository journalEntryRepository,
                         InvoiceRepository invoiceRepository,
                         ExpenseRepository expenseRepository,
                         ClientRepository clientRepository,
                         SupplierRepository supplierRepository,
                         SupplierInvoiceRepository supplierInvoiceRepository,
                         CompanyContext companyContext) {
        this.accountRepository         = accountRepository;
        this.journalLineRepository     = journalLineRepository;
        this.journalEntryRepository    = journalEntryRepository;
        this.invoiceRepository         = invoiceRepository;
        this.expenseRepository         = expenseRepository;
        this.clientRepository          = clientRepository;
        this.supplierRepository        = supplierRepository;
        this.supplierInvoiceRepository = supplierInvoiceRepository;
        this.companyContext            = companyContext;
    }

    // ============================================================
    // PROFIT & LOSS — exclude CLOSE- pentru a nu dubla 6xx/7xx
    // ============================================================
    public ProfitAndLossResponse getProfitAndLoss(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        List<Account> allAccounts = accountRepository.findByIsActiveTrue().stream()
                .filter(a -> a.getCode().startsWith("6") || a.getCode().startsWith("7"))
                .collect(Collectors.toList());

        List<ReportLineItem> revenueLines = allAccounts.stream()
                .filter(a -> a.getCode().startsWith("7"))
                .map(a -> {
                    BigDecimal credits = sumCredits(a.getId(), from, to, companyId);
                    BigDecimal debits  = sumDebits(a.getId(), from, to, companyId);
                    return new ReportLineItem(a.getCode(), a.getName(), credits.subtract(debits));
                })
                .filter(l -> l.amount().compareTo(BigDecimal.ZERO) != 0)
                .sorted(Comparator.comparing(ReportLineItem::accountCode))
                .collect(Collectors.toList());

        List<ReportLineItem> expenseLines = allAccounts.stream()
                .filter(a -> a.getCode().startsWith("6"))
                .map(a -> {
                    BigDecimal debits  = sumDebits(a.getId(), from, to, companyId);
                    BigDecimal credits = sumCredits(a.getId(), from, to, companyId);
                    return new ReportLineItem(a.getCode(), a.getName(), debits.subtract(credits));
                })
                .filter(l -> l.amount().compareTo(BigDecimal.ZERO) != 0)
                .sorted(Comparator.comparing(ReportLineItem::accountCode))
                .collect(Collectors.toList());

        BigDecimal totalRevenue  = sum(revenueLines);
        BigDecimal totalExpenses = sum(expenseLines);

        return new ProfitAndLossResponse(from.toString(), to.toString(),
                revenueLines, totalRevenue, expenseLines, totalExpenses,
                totalRevenue.subtract(totalExpenses));
    }

    // ============================================================
    // BALANCE SHEET — exclude CLOSE- pentru solduri corecte
    // Daca exercitiul e inchis, 121 apare natural din nota CLOSE-
    // Daca nu e inchis, adaugam profitul curent virtual
    // ============================================================
    public BalanceSheetResponse getBalanceSheet(LocalDate asOf) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        LocalDate bof = LocalDate.of(2000, 1, 1);

        List<Account> allAccounts = accountRepository.findByIsActiveTrue().stream()
                .filter(a -> a.getCode().matches("^[12345].*"))
                .collect(Collectors.toList());

        List<ReportLineItem> assetLines = allAccounts.stream()
                .filter(a -> a.getCode().matches("^[2345].*"))
                .map(a -> {
                    BigDecimal debit  = sumDebitsAll(a.getId(), bof, asOf, companyId);
                    BigDecimal credit = sumCreditsAll(a.getId(), bof, asOf, companyId);
                    return new ReportLineItem(a.getCode(), a.getName(), debit.subtract(credit));
                })
                .filter(l -> l.amount().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(ReportLineItem::accountCode))
                .collect(Collectors.toList());

        List<ReportLineItem> liabilityLines = allAccounts.stream()
                .filter(a -> a.getCode().matches("^[45].*"))
                .map(a -> {
                    BigDecimal credit = sumCreditsAll(a.getId(), bof, asOf, companyId);
                    BigDecimal debit  = sumDebitsAll(a.getId(), bof, asOf, companyId);
                    return new ReportLineItem(a.getCode(), a.getName(), credit.subtract(debit));
                })
                .filter(l -> l.amount().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(ReportLineItem::accountCode))
                .collect(Collectors.toList());

        List<ReportLineItem> equityLines = allAccounts.stream()
                .filter(a -> a.getCode().startsWith("1"))
                .map(a -> {
                    BigDecimal credit = sumCreditsAll(a.getId(), bof, asOf, companyId);
                    BigDecimal debit  = sumDebitsAll(a.getId(), bof, asOf, companyId);
                    return new ReportLineItem(a.getCode(), a.getName(), credit.subtract(debit));
                })
                .filter(l -> l.amount().compareTo(BigDecimal.ZERO) != 0)
                .sorted(Comparator.comparing(ReportLineItem::accountCode))
                .collect(Collectors.toList());

        // Daca contul 121 nu are sold (exercitiu neînchis), adaugam profitul curent virtual
        boolean has121 = equityLines.stream().anyMatch(l -> l.accountCode().equals("121"));
        if (!has121) {
            BigDecimal totalRevenue7 = accountRepository.findByIsActiveTrue().stream()
                    .filter(a -> a.getCode().startsWith("7"))
                    .map(a -> sumCredits(a.getId(), bof, asOf, companyId)
                            .subtract(sumDebits(a.getId(), bof, asOf, companyId)))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpense6 = accountRepository.findByIsActiveTrue().stream()
                    .filter(a -> a.getCode().startsWith("6"))
                    .map(a -> sumDebits(a.getId(), bof, asOf, companyId)
                            .subtract(sumCredits(a.getId(), bof, asOf, companyId)))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal currentYearProfit = totalRevenue7.subtract(totalExpense6);
            if (currentYearProfit.compareTo(BigDecimal.ZERO) != 0) {
                equityLines.add(new ReportLineItem("121", "Profit sau pierdere (curent)", currentYearProfit));
            }
        }

        BigDecimal totalAssets      = sum(assetLines);
        BigDecimal totalLiabilities = sum(liabilityLines);
        BigDecimal totalEquity      = sum(equityLines);

        return new BalanceSheetResponse(asOf.toString(),
                assetLines, totalAssets,
                liabilityLines, totalLiabilities,
                equityLines, totalEquity,
                totalLiabilities.add(totalEquity));
    }

    // ============================================================
    // CASH FLOW
    // ============================================================
    public CashFlowResponse getCashFlow(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        List<Account> cashAccounts = accountRepository
                .findByTypeAndIsActiveTrue(AccountType.ASSET).stream()
                .filter(a -> "CURRENT_ASSET".equals(a.getSubType()))
                .collect(Collectors.toList());

        BigDecimal totalInflows  = BigDecimal.ZERO;
        BigDecimal totalOutflows = BigDecimal.ZERO;

        for (Account a : cashAccounts) {
            totalInflows  = totalInflows.add(sumDebits(a.getId(), from, to, companyId));
            totalOutflows = totalOutflows.add(sumCredits(a.getId(), from, to, companyId));
        }

        return new CashFlowResponse(from.toString(), to.toString(),
                totalInflows, totalOutflows, totalInflows.subtract(totalOutflows));
    }

    // ============================================================
    // DASHBOARD SUMMARY
    // ============================================================
    public DashboardSummaryResponse getDashboardSummary() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        LocalDate first = LocalDate.now().withDayOfMonth(1);
        LocalDate last  = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        // Exclude CLOSE- pentru a nu dubla cifrele din dashboard
        BigDecimal rev = accountRepository.findByIsActiveTrue().stream()
                .filter(a -> a.getCode().startsWith("7"))
                .map(a -> sumCredits(a.getId(), first, last, companyId)
                        .subtract(sumDebits(a.getId(), first, last, companyId)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal exp = accountRepository.findByIsActiveTrue().stream()
                .filter(a -> a.getCode().startsWith("6"))
                .map(a -> sumDebits(a.getId(), first, last, companyId)
                        .subtract(sumCredits(a.getId(), first, last, companyId)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstanding = invoiceRepository.sumOutstandingByCompanyId(companyId);
        long pendingExp = expenseRepository.findByStatusAndCompany_Id(
                Expense.ExpenseStatus.PENDING, companyId).size();

        return new DashboardSummaryResponse(rev, exp, rev.subtract(exp), outstanding, outstanding, pendingExp);
    }

    // ============================================================
    // BALANȚĂ CONTABILĂ — include CLOSE- (utilizatorul vede inchiderea)
    // ============================================================
    public List<TrialBalanceLine> getTrialBalance(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        LocalDate bof       = LocalDate.of(2000, 1, 1);
        LocalDate dayBefore = from.minusDays(1);

        return accountRepository.findByIsActiveTrue().stream()
                .map(account -> {
                    BigDecimal siDebit  = sumDebitsAll(account.getId(), bof, dayBefore, companyId);
                    BigDecimal siCredit = sumCreditsAll(account.getId(), bof, dayBefore, companyId);
                    BigDecimal rdDebit  = sumDebitsAll(account.getId(), from, to, companyId);
                    BigDecimal rdCredit = sumCreditsAll(account.getId(), from, to, companyId);

                    BigDecimal sfDebitRaw  = siDebit.add(rdDebit);
                    BigDecimal sfCreditRaw = siCredit.add(rdCredit);
                    BigDecimal diff        = sfDebitRaw.subtract(sfCreditRaw);

                    return new TrialBalanceLine(
                            account.getCode(), account.getName(), account.getType().name(),
                            siDebit, siCredit, rdDebit, rdCredit,
                            diff.compareTo(BigDecimal.ZERO) >= 0 ? diff : BigDecimal.ZERO,
                            diff.compareTo(BigDecimal.ZERO) < 0  ? diff.abs() : BigDecimal.ZERO
                    );
                })
                .filter(l -> l.siDebit().compareTo(BigDecimal.ZERO) != 0
                        || l.siCredit().compareTo(BigDecimal.ZERO) != 0
                        || l.rdDebit().compareTo(BigDecimal.ZERO) != 0
                        || l.rdCredit().compareTo(BigDecimal.ZERO) != 0)
                .sorted(Comparator.comparing(TrialBalanceLine::accountCode))
                .collect(Collectors.toList());
    }

    // ============================================================
    // FIȘĂ CONT — include CLOSE- (utilizatorul vede mișcarea de inchidere)
    // ============================================================
    public AccountLedgerResponse getAccountLedger(Integer accountId, LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found: " + accountId));

        LocalDate bof       = LocalDate.of(2000, 1, 1);
        LocalDate dayBefore = from.minusDays(1);

        BigDecimal siDebit  = sumDebitsAll(accountId, bof, dayBefore, companyId);
        BigDecimal siCredit = sumCreditsAll(accountId, bof, dayBefore, companyId);
        BigDecimal soldInitial = account.normalBalanceIsDebit()
                ? siDebit.subtract(siCredit)
                : siCredit.subtract(siDebit);

        List<JournalLine> allLines = journalLineRepository
                .findByAccountIdAndCompanyId(accountId, companyId).stream()
                .filter(jl -> {
                    LocalDate d = jl.getJournalEntry().getEntryDate();
                    return !d.isBefore(from) && !d.isAfter(to)
                            && jl.getJournalEntry().getStatus() == JournalEntry.JournalStatus.POSTED;
                })
                .sorted(Comparator.comparing(jl -> jl.getJournalEntry().getEntryDate()))
                .collect(Collectors.toList());

        BigDecimal runningBalance = soldInitial;
        List<LedgerLine> lines = new ArrayList<>();

        for (JournalLine jl : allLines) {
            BigDecimal debit  = jl.getDebitAmount();
            BigDecimal credit = jl.getCreditAmount();

            runningBalance = account.normalBalanceIsDebit()
                    ? runningBalance.add(debit).subtract(credit)
                    : runningBalance.add(credit).subtract(debit);

            lines.add(new LedgerLine(
                    jl.getJournalEntry().getEntryDate().toString(),
                    jl.getJournalEntry().getReferenceNumber(),
                    jl.getDescription() != null
                            ? jl.getDescription()
                            : jl.getJournalEntry().getDescription(),
                    debit, credit, runningBalance
            ));
        }

        BigDecimal totalDebit  = allLines.stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = allLines.stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AccountLedgerResponse(
                account.getCode(), account.getName(), account.getType().name(),
                from.toString(), to.toString(),
                soldInitial, lines, totalDebit, totalCredit, runningBalance
        );
    }

    // ============================================================
    // REGISTRU JURNAL — include toate notele inclusiv CLOSE-
    // ============================================================
    public List<GeneralJournalLine> getGeneralJournal(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        return journalEntryRepository
                .findByEntryDateBetweenAndCompany_Id(from, to, companyId).stream()
                .filter(je -> je.getStatus() == JournalEntry.JournalStatus.POSTED)
                .sorted(Comparator.comparing(JournalEntry::getEntryDate))
                .flatMap(je -> {
                    List<GeneralJournalLine> result = new ArrayList<>();
                    if (je.getLines() == null) return result.stream();
                    for (JournalLine jl : je.getLines()) {
                        result.add(new GeneralJournalLine(
                                je.getEntryDate().toString(),
                                je.getReferenceNumber(),
                                je.getDescription(),
                                jl.getAccount().getCode(),
                                jl.getAccount().getName(),
                                jl.getDebitAmount(),
                                jl.getCreditAmount()
                        ));
                    }
                    return result.stream();
                })
                .collect(Collectors.toList());
    }

    // ============================================================
    // JURNAL VÂNZĂRI
    // ============================================================
    public List<SalesJournalLine> getSalesJournal(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        return invoiceRepository.findValidatedByCompanyIdAndIssueDateBetween(companyId, from, to).stream()
                .sorted(Comparator.comparing(Invoice::getIssueDate))
                .map(inv -> new SalesJournalLine(
                        inv.getIssueDate().toString(),
                        inv.getInvoiceNumber(),
                        inv.getClient().getName(),
                        inv.getClient().getTaxId(),
                        inv.getSubtotal(),
                        inv.getTaxAmount(),
                        inv.getTotal(),
                        inv.getTaxRate() != null ? inv.getTaxRate().getRate() + "%" : "0%",
                        inv.getStatus().name()
                ))
                .collect(Collectors.toList());
    }

    // ============================================================
    // JURNAL CUMPĂRĂRI
    // ============================================================
    public List<PurchaseJournalLine> getPurchaseJournal(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        return supplierInvoiceRepository.findByCompanyIdAndIssueDateBetween(companyId, from, to).stream()
                .filter(inv -> inv.getStatus() != SupplierInvoice.SupplierInvoiceStatus.VOID)
                .sorted(Comparator.comparing(SupplierInvoice::getIssueDate))
                .map(inv -> new PurchaseJournalLine(
                        inv.getIssueDate().toString(),
                        inv.getInvoiceNumber(),
                        inv.getSupplier().getName(),
                        inv.getSupplier().getTaxId(),
                        inv.getExpenseAccount().getCode(),
                        inv.getExpenseAccount().getName(),
                        inv.getSubtotal(),
                        inv.getVatAmount(),
                        inv.getTotal(),
                        inv.getTaxRate() != null ? inv.getTaxRate().getRate() + "%" : "0%",
                        inv.getStatus().name()
                ))
                .collect(Collectors.toList());
    }

    // ============================================================
    // SITUAȚIE CLIENȚI
    // ============================================================
    public List<ClientStatementLine> getClientStatement(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        return clientRepository.findByIsActiveTrueAndCompany_Id(companyId).stream()
                .map(client -> {
                    List<Invoice> clientInvoices = invoiceRepository
                            .findByClientIdAndCompany_Id(client.getId(), companyId);

                    BigDecimal soldInitial = clientInvoices.stream()
                            .filter(inv -> inv.getIssueDate().isBefore(from))
                            .filter(inv -> inv.getStatus() == Invoice.InvoiceStatus.VALIDATED
                                    || inv.getStatus() == Invoice.InvoiceStatus.OVERDUE)
                            .map(Invoice::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal intrari = clientInvoices.stream()
                            .filter(inv -> !inv.getIssueDate().isBefore(from) && !inv.getIssueDate().isAfter(to))
                            .filter(inv -> inv.getStatus() == Invoice.InvoiceStatus.VALIDATED
                                    || inv.getStatus() == Invoice.InvoiceStatus.PAID
                                    || inv.getStatus() == Invoice.InvoiceStatus.OVERDUE)
                            .map(Invoice::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal incasari = clientInvoices.stream()
                            .filter(inv -> inv.getStatus() == Invoice.InvoiceStatus.PAID)
                            .filter(inv -> !inv.getIssueDate().isBefore(from) && !inv.getIssueDate().isAfter(to))
                            .map(Invoice::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal soldFinal = soldInitial.add(intrari).subtract(incasari);

                    if (soldInitial.compareTo(BigDecimal.ZERO) == 0
                            && intrari.compareTo(BigDecimal.ZERO) == 0
                            && soldFinal.compareTo(BigDecimal.ZERO) == 0) return null;

                    return new ClientStatementLine(client.getId(), client.getName(), client.getTaxId(),
                            soldInitial, intrari, incasari, soldFinal);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(ClientStatementLine::clientName))
                .collect(Collectors.toList());
    }

    // ============================================================
    // SITUAȚIE FURNIZORI
    // ============================================================
    public List<SupplierStatementLine> getSupplierStatement(LocalDate from, LocalDate to) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        return supplierRepository.findByIsActiveTrueAndCompany_Id(companyId).stream()
                .map(supplier -> {
                    List<SupplierInvoice> allInv = supplierInvoiceRepository
                            .findBySupplierIdAndCompanyId(supplier.getId(), companyId);

                    BigDecimal soldInitial = allInv.stream()
                            .filter(inv -> inv.getIssueDate().isBefore(from))
                            .filter(inv -> inv.getStatus() == SupplierInvoice.SupplierInvoiceStatus.PENDING
                                    || inv.getStatus() == SupplierInvoice.SupplierInvoiceStatus.OVERDUE)
                            .map(SupplierInvoice::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal intrari = allInv.stream()
                            .filter(inv -> !inv.getIssueDate().isBefore(from) && !inv.getIssueDate().isAfter(to))
                            .filter(inv -> inv.getStatus() != SupplierInvoice.SupplierInvoiceStatus.VOID)
                            .map(SupplierInvoice::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal plati = allInv.stream()
                            .filter(inv -> inv.getStatus() == SupplierInvoice.SupplierInvoiceStatus.PAID)
                            .filter(inv -> !inv.getIssueDate().isBefore(from) && !inv.getIssueDate().isAfter(to))
                            .map(SupplierInvoice::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal soldFinal = soldInitial.add(intrari).subtract(plati);

                    if (soldInitial.compareTo(BigDecimal.ZERO) == 0
                            && intrari.compareTo(BigDecimal.ZERO) == 0
                            && soldFinal.compareTo(BigDecimal.ZERO) == 0) return null;

                    return new SupplierStatementLine(supplier.getId(), supplier.getName(), supplier.getTaxId(),
                            soldInitial, intrari, plati, soldFinal);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(SupplierStatementLine::supplierName))
                .collect(Collectors.toList());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    // Exclude CLOSE- — pentru P&L, Bilant, Dashboard
    private BigDecimal sumDebits(Integer accountId, LocalDate from, LocalDate to, Integer companyId) {
        return journalLineRepository.sumDebitsByAccountAndDateRangeAndCompany(accountId, from, to, companyId);
    }

    private BigDecimal sumCredits(Integer accountId, LocalDate from, LocalDate to, Integer companyId) {
        return journalLineRepository.sumCreditsByAccountAndDateRangeAndCompany(accountId, from, to, companyId);
    }

    // Include CLOSE- — pentru Balanta, Fisa de cont
    private BigDecimal sumDebitsAll(Integer accountId, LocalDate from, LocalDate to, Integer companyId) {
        return journalLineRepository.sumDebitsByAccountAndDateRangeAndCompanyAll(accountId, from, to, companyId);
    }

    private BigDecimal sumCreditsAll(Integer accountId, LocalDate from, LocalDate to, Integer companyId) {
        return journalLineRepository.sumCreditsByAccountAndDateRangeAndCompanyAll(accountId, from, to, companyId);
    }

    private BigDecimal sum(List<ReportLineItem> lines) {
        return lines.stream().map(ReportLineItem::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}