package com.Accountancy.app.services;

import com.Accountancy.app.entities.*;
import com.Accountancy.app.repositories.JournalEntryRepository;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import com.Accountancy.app.controllers.JournalEntryController.CreateJournalEntryRequest;
import com.Accountancy.app.repositories.AccountRepository;
import com.Accountancy.app.repositories.CompanyRepository;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import com.Accountancy.app.repositories.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class JournalEntryService {

    private final JournalEntryRepository journalEntryRepository;
    private final CompanyContext         companyContext;
    private final AccountRepository      accountRepository;
    private final CompanyRepository      companyRepository;
    private final UserRepository         userRepository;

    public JournalEntryService(JournalEntryRepository journalEntryRepository,
                               CompanyContext companyContext,
                               AccountRepository accountRepository,
                               CompanyRepository companyRepository,
                               UserRepository userRepository) {
        this.journalEntryRepository = journalEntryRepository;
        this.companyContext          = companyContext;
        this.accountRepository       = accountRepository;
        this.companyRepository       = companyRepository;
        this.userRepository          = userRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // GET ALL
    // ─────────────────────────────────────────────────────────────
    public List<JournalEntry> getAllEntries() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return journalEntryRepository.findByCompany_IdOrderByEntryDateDesc(companyId);
    }

    // ─────────────────────────────────────────────────────────────
    // FIND BY REFERENCE
    // ─────────────────────────────────────────────────────────────
    public Optional<JournalEntry> findByReferenceNumber(String referenceNumber) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return journalEntryRepository.findByReferenceNumberAndCompany_Id(referenceNumber, companyId);
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE MANUAL ENTRY
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public JournalEntry createManualEntry(CreateJournalEntryRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        String username  = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        BigDecimal totalDebit = request.lines().stream()
                .map(l -> l.debitAmount() != null ? l.debitAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = request.lines().stream()
                .map(l -> l.creditAmount() != null ? l.creditAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new RuntimeException("Nota contabila nu este echilibrata: Debit "
                    + totalDebit + " ≠ Credit " + totalCredit);
        }

        String reference = generateNoteReference();

        JournalEntry entry = new JournalEntry();
        entry.setCompany(company);
        entry.setUser(currentUser);
        entry.setReferenceNumber(reference);
        entry.setEntryDate(request.entryDate());
        entry.setDescription(request.description());
        entry.setStatus(JournalEntry.JournalStatus.POSTED);

        List<JournalLine> lines = request.lines().stream().map(l -> {
            Account account = accountRepository.findById(l.accountId())
                    .orElseThrow(() -> new RuntimeException("Account not found: " + l.accountId()));
            JournalLine line = new JournalLine();
            line.setJournalEntry(entry);
            line.setCompany(company);
            line.setAccount(account);
            line.setDebitAmount(l.debitAmount()  != null ? l.debitAmount()  : BigDecimal.ZERO);
            line.setCreditAmount(l.creditAmount() != null ? l.creditAmount() : BigDecimal.ZERO);
            line.setDescription(l.description()  != null ? l.description()  : request.description());
            return line;
        }).toList();

        entry.setLines(lines);
        return journalEntryRepository.save(entry);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER — referinta inchidere
    // Format: CLOSE-2026-05 (lunar) sau CLOSE-2026 (anual, month=0)
    // ─────────────────────────────────────────────────────────────
    private String closeRef(int year, int month) {
        return month > 0
                ? String.format("CLOSE-%d-%02d", year, month)
                : String.format("CLOSE-%d", year);
    }

    // ─────────────────────────────────────────────────────────────
    // INCHIDERE — STATUS
    // ─────────────────────────────────────────────────────────────
    public boolean isPeriodClosed(int year, int month) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        String ref = closeRef(year, month);
        return journalEntryRepository
                .findByReferenceNumberAndCompany_Id(ref, companyId)
                .isPresent();
    }

    // ─────────────────────────────────────────────────────────────
    // INCHIDERE — VALIDARE (model SAGA: O SINGURA NOTA cu toate liniile)
    //
    // Structura notei (ca in SAGA):
    //   DEBIT  121   = total cheltuieli (6xx)
    //   CREDIT 6xx   = fiecare cont de cheltuiala in parte
    //   DEBIT  7xx   = fiecare cont de venituri in parte
    //   CREDIT 121   = total venituri (7xx)
    //
    // Nota este echilibrata:
    //   Total debit  = cheltuieli + venituri
    //   Total credit = cheltuieli + venituri
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public JournalEntry closePeriod(int year, int month) {
        Integer companyId = companyContext.requireCurrentCompanyId();

        if (isPeriodClosed(year, month)) {
            String period = month > 0
                    ? String.format("%02d.%d", month, year)
                    : String.valueOf(year);
            throw new RuntimeException("Perioada " + period + " este deja inchisa.");
        }

        Company company  = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        String username  = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Intervalul perioadei
        LocalDate rangeFrom = month > 0
                ? LocalDate.of(year, month, 1)
                : LocalDate.of(year, 1, 1);
        LocalDate rangeTo = month > 0
                ? rangeFrom.withDayOfMonth(rangeFrom.lengthOfMonth())
                : LocalDate.of(year, 12, 31);

        String period = month > 0
                ? String.format("%02d.%d", month, year)
                : String.valueOf(year);

        // Cont 121 — Profit sau pierdere
        Account cont121 = accountRepository.findByCode("121")
                .orElseThrow(() -> new RuntimeException(
                        "Contul 121 nu exista in planul de conturi. Adauga-l inainte de inchidere."));

        // ── Calcul solduri 6xx (cheltuieli = debit net) ──
        record AccAmt(Account account, BigDecimal amount) {}
        List<AccAmt> cheSolduri = new ArrayList<>();
        BigDecimal totalCheltuieli = BigDecimal.ZERO;

        for (Account a : accountRepository.findByIsActiveTrue().stream()
                .filter(a -> a.getCode().startsWith("6")).toList()) {
            BigDecimal sold = sumDebits(a.getId(), rangeFrom, rangeTo, companyId)
                    .subtract(sumCredits(a.getId(), rangeFrom, rangeTo, companyId));
            if (sold.compareTo(BigDecimal.ZERO) > 0) {
                cheSolduri.add(new AccAmt(a, sold));
                totalCheltuieli = totalCheltuieli.add(sold);
            }
        }

        // ── Calcul solduri 7xx (venituri = credit net) ──
        List<AccAmt> venSolduri = new ArrayList<>();
        BigDecimal totalVenituri = BigDecimal.ZERO;

        for (Account a : accountRepository.findByIsActiveTrue().stream()
                .filter(a -> a.getCode().startsWith("7")).toList()) {
            BigDecimal sold = sumCredits(a.getId(), rangeFrom, rangeTo, companyId)
                    .subtract(sumDebits(a.getId(), rangeFrom, rangeTo, companyId));
            if (sold.compareTo(BigDecimal.ZERO) > 0) {
                venSolduri.add(new AccAmt(a, sold));
                totalVenituri = totalVenituri.add(sold);
            }
        }

        if (cheSolduri.isEmpty() && venSolduri.isEmpty()) {
            throw new RuntimeException(
                    "Nu exista venituri sau cheltuieli de inchis pentru perioada " + period + ".");
        }

        // ── Construieste nota unica (model SAGA) ──
        JournalEntry entry = new JournalEntry();
        entry.setCompany(company);
        entry.setUser(currentUser);
        entry.setReferenceNumber(closeRef(year, month));
        entry.setEntryDate(rangeTo);
        entry.setDescription("Inchidere luna " + period);
        entry.setStatus(JournalEntry.JournalStatus.POSTED);

        List<JournalLine> noteLines = new ArrayList<>();

        // 1. DEBIT 121 = total cheltuieli (dacă există cheltuieli)
        if (totalCheltuieli.compareTo(BigDecimal.ZERO) > 0) {
            JournalLine dr121 = new JournalLine();
            dr121.setJournalEntry(entry);
            dr121.setCompany(company);
            dr121.setAccount(cont121);
            dr121.setDebitAmount(totalCheltuieli);
            dr121.setCreditAmount(BigDecimal.ZERO);
            dr121.setDescription("Inchidere luna " + period);
            noteLines.add(dr121);
        }

        // 2. CREDIT fiecare cont 6xx
        for (AccAmt aa : cheSolduri) {
            JournalLine l = new JournalLine();
            l.setJournalEntry(entry);
            l.setCompany(company);
            l.setAccount(aa.account());
            l.setDebitAmount(BigDecimal.ZERO);
            l.setCreditAmount(aa.amount());
            l.setDescription("Inchidere luna " + period);
            noteLines.add(l);
        }

        // 3. DEBIT fiecare cont 7xx
        for (AccAmt aa : venSolduri) {
            JournalLine l = new JournalLine();
            l.setJournalEntry(entry);
            l.setCompany(company);
            l.setAccount(aa.account());
            l.setDebitAmount(aa.amount());
            l.setCreditAmount(BigDecimal.ZERO);
            l.setDescription("Inchidere luna " + period);
            noteLines.add(l);
        }

        // 4. CREDIT 121 = total venituri (dacă există venituri)
        if (totalVenituri.compareTo(BigDecimal.ZERO) > 0) {
            JournalLine cr121 = new JournalLine();
            cr121.setJournalEntry(entry);
            cr121.setCompany(company);
            cr121.setAccount(cont121);
            cr121.setDebitAmount(BigDecimal.ZERO);
            cr121.setCreditAmount(totalVenituri);
            cr121.setDescription("Inchidere luna " + period);
            noteLines.add(cr121);
        }

        entry.setLines(noteLines);
        return journalEntryRepository.save(entry);
    }

    // ─────────────────────────────────────────────────────────────
    // INCHIDERE — DEVALIDARE
    // Sterge nota din DB → dispare automat din toate rapoartele
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public void cancelClosePeriod(int year, int month) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        journalEntryRepository
                .findByReferenceNumberAndCompany_Id(closeRef(year, month), companyId)
                .ifPresent(journalEntryRepository::delete);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS PRIVATE
    // ─────────────────────────────────────────────────────────────
    private BigDecimal sumDebits(Integer accountId, LocalDate from, LocalDate to, Integer companyId) {
        return journalEntryRepository.findByCompany_IdOrderByEntryDateDesc(companyId).stream()
                .filter(je -> !je.getEntryDate().isBefore(from) && !je.getEntryDate().isAfter(to))
                .filter(je -> je.getStatus() == JournalEntry.JournalStatus.POSTED)
                // Exclude notele de inchidere din calculul soldurilor — altfel s-ar dubla
                .filter(je -> !je.getReferenceNumber().startsWith("CLOSE-"))
                .flatMap(je -> je.getLines() == null
                        ? java.util.stream.Stream.empty() : je.getLines().stream())
                .filter(l -> l.getAccount().getId().equals(accountId))
                .map(JournalLine::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumCredits(Integer accountId, LocalDate from, LocalDate to, Integer companyId) {
        return journalEntryRepository.findByCompany_IdOrderByEntryDateDesc(companyId).stream()
                .filter(je -> !je.getEntryDate().isBefore(from) && !je.getEntryDate().isAfter(to))
                .filter(je -> je.getStatus() == JournalEntry.JournalStatus.POSTED)
                // Exclude notele de inchidere din calculul soldurilor — altfel s-ar dubla
                .filter(je -> !je.getReferenceNumber().startsWith("CLOSE-"))
                .flatMap(je -> je.getLines() == null
                        ? java.util.stream.Stream.empty() : je.getLines().stream())
                .filter(l -> l.getAccount().getId().equals(accountId))
                .map(JournalLine::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String generateNoteReference() {
        int year = Year.now().getValue();
        String prefix = "NOTE-" + year + "-";
        List<JournalEntry> existing = journalEntryRepository
                .findByReferenceNumberStartingWith(prefix);
        int next = existing.stream()
                .map(e -> e.getReferenceNumber().replace(prefix, ""))
                .mapToInt(s -> {
                    try { return Integer.parseInt(s); } catch (Exception ex) { return 0; }
                })
                .max().orElse(0) + 1;
        return prefix + String.format("%05d", next);
    }
}