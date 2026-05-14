package com.Accountancy.app.controllers;

import com.Accountancy.app.entities.JournalEntry;
import com.Accountancy.app.entities.JournalLine;
import com.Accountancy.app.services.JournalEntryService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal-entries")
@SecurityRequirement(name = "bearerAuth")
public class JournalEntryController {

    private final JournalEntryService journalEntryService;

    public JournalEntryController(JournalEntryService journalEntryService) {
        this.journalEntryService = journalEntryService;
    }

    // GET /api/journal-entries
    @GetMapping
    public ResponseEntity<List<JournalEntryResponse>> getAll() {
        return ResponseEntity.ok(
                journalEntryService.getAllEntries()
                        .stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    // GET /api/journal-entries/reference/{ref}
    @GetMapping("/reference/{referenceNumber}")
    public ResponseEntity<JournalEntryResponse> getByReferenceNumber(
            @PathVariable String referenceNumber) {
        return journalEntryService.findByReferenceNumber(referenceNumber)
                .map(entry -> ResponseEntity.ok(toResponse(entry)))
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/journal-entries
    @PostMapping
    public ResponseEntity<JournalEntryResponse> create(
            @RequestBody CreateJournalEntryRequest request) {
        JournalEntry entry = journalEntryService.createManualEntry(request);
        return ResponseEntity.ok(toResponse(entry));
    }

    // ── INCHIDERE LUNA / EXERCITIU ────────────────────────────────

    // GET /api/journal-entries/close-period/status?year=2026&month=5
    @GetMapping("/close-period/status")
    public ResponseEntity<Map<String, Object>> getClosePeriodStatus(
            @RequestParam int year,
            @RequestParam(defaultValue = "0") int month) {
        boolean closed = journalEntryService.isPeriodClosed(year, month);
        return ResponseEntity.ok(Map.of("year", year, "month", month, "closed", closed));
    }

    // POST /api/journal-entries/close-period?year=2026&month=5
    // Returneaza nota unica de inchidere (model SAGA)
    @PostMapping("/close-period")
    public ResponseEntity<JournalEntryResponse> closePeriod(
            @RequestParam int year,
            @RequestParam(defaultValue = "0") int month) {
        JournalEntry entry = journalEntryService.closePeriod(year, month);
        return ResponseEntity.ok(toResponse(entry));
    }

    // DELETE /api/journal-entries/close-period?year=2026&month=5
    // Devalidare — sterge nota din DB, dispare din toate rapoartele
    @DeleteMapping("/close-period")
    public ResponseEntity<Void> cancelClosePeriod(
            @RequestParam int year,
            @RequestParam(defaultValue = "0") int month) {
        journalEntryService.cancelClosePeriod(year, month);
        return ResponseEntity.ok().build();
    }

    // ─── Internal DTOs ───────────────────────────────────────────

    public record JournalEntryResponse(
            Integer id,
            String referenceNumber,
            LocalDate entryDate,
            String description,
            String status,
            List<JournalLineResponse> lines
    ) {}

    public record JournalLineResponse(
            Integer id,
            String accountCode,
            String accountName,
            String accountType,
            BigDecimal debitAmount,
            BigDecimal creditAmount,
            String description
    ) {}

    public record CreateJournalEntryRequest(
            String description,
            LocalDate entryDate,
            List<CreateJournalLineRequest> lines
    ) {}

    public record CreateJournalLineRequest(
            Integer accountId,
            BigDecimal debitAmount,
            BigDecimal creditAmount,
            String description
    ) {}

    // ─── Mappers ─────────────────────────────────────────────────

    private JournalEntryResponse toResponse(JournalEntry entry) {
        List<JournalLineResponse> lines = entry.getLines() == null
                ? List.of()
                : entry.getLines().stream()
                .map(this::toLineResponse)
                .toList();
        return new JournalEntryResponse(
                entry.getId(),
                entry.getReferenceNumber(),
                entry.getEntryDate(),
                entry.getDescription(),
                entry.getStatus().name(),
                lines
        );
    }

    private JournalLineResponse toLineResponse(JournalLine line) {
        return new JournalLineResponse(
                line.getId(),
                line.getAccount().getCode(),
                line.getAccount().getName(),
                line.getAccount().getType().name(),
                line.getDebitAmount(),
                line.getCreditAmount(),
                line.getDescription()
        );
    }
}