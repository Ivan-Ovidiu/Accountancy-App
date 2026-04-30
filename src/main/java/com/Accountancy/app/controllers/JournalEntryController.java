package com.Accountancy.app.controllers;

import com.Accountancy.app.entities.JournalEntry;
import com.Accountancy.app.entities.JournalLine;
import com.Accountancy.app.repositories.JournalEntryRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/journal-entries")
@SecurityRequirement(name = "bearerAuth")
public class JournalEntryController {

    private final JournalEntryRepository journalEntryRepository;

    public JournalEntryController(JournalEntryRepository journalEntryRepository) {
        this.journalEntryRepository = journalEntryRepository;
    }

    // GET /api/journal-entries/reference/{ref}
    // Folosit de frontend pentru a afisa nota contabila pe o factura/cheltuiala
    @GetMapping("/reference/{referenceNumber}")
    public ResponseEntity<JournalEntryResponse> getByReferenceNumber(
            @PathVariable String referenceNumber) {

        return journalEntryRepository.findByReferenceNumber(referenceNumber)
                .map(entry -> ResponseEntity.ok(toResponse(entry)))
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/journal-entries — toate inregistrarile
    @GetMapping
    public ResponseEntity<List<JournalEntryResponse>> getAll() {
        return ResponseEntity.ok(
                journalEntryRepository.findAll()
                        .stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    // ─── DTO-uri interne (record classes) ───────────────────────────────────

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

    // ─── Mapper ─────────────────────────────────────────────────────────────

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