package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.InvoiceDTO.InvoiceRequest;
import com.Accountancy.app.dto.InvoiceDTO.InvoiceUpdateRequest;
import com.Accountancy.app.dto.InvoiceDTO.InvoiceResponse;
import com.Accountancy.app.entities.Invoice.InvoiceStatus;
import com.Accountancy.app.services.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@SecurityRequirement(name = "bearerAuth")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @Operation(summary = "Get all invoices for current company")
    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @Operation(summary = "Get invoice by ID")
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @Operation(summary = "Get all invoices for a specific client")
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByClient(@PathVariable Integer clientId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByClient(clientId));
    }

    @Operation(summary = "Get invoices filtered by status")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByStatus(@PathVariable InvoiceStatus status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    @Operation(summary = "Get validated invoices past due date")
    @GetMapping("/overdue")
    public ResponseEntity<List<InvoiceResponse>> getOverdueInvoices() {
        return ResponseEntity.ok(invoiceService.getOverdueInvoices());
    }

    @Operation(summary = "Create a new invoice with status ISSUED")
    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(request));
    }

    @Operation(summary = "Validate invoice: ISSUED → VALIDATED. Posts journal entry.")
    @PostMapping("/{id}/validate")
    public ResponseEntity<InvoiceResponse> validateInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.validateInvoice(id));
    }

    @Operation(summary = "Unvalidate invoice: VALIDATED → ISSUED. Deletes journal entry.")
    @PostMapping("/{id}/unvalidate")
    public ResponseEntity<InvoiceResponse> unvalidateInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.unvalidateInvoice(id));
    }

    @Operation(summary = "Mark invoice as paid: VALIDATED / OVERDUE → PAID")
    @PostMapping("/{id}/pay")
    public ResponseEntity<InvoiceResponse> markAsPaid(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.markAsPaid(id));
    }

    @Operation(summary = "Void invoice")
    @PostMapping("/{id}/void")
    public ResponseEntity<InvoiceResponse> voidInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.voidInvoice(id));
    }

    @Operation(summary = "Check and mark overdue invoices")
    @PostMapping("/check-overdue")
    public ResponseEntity<Map<String, Integer>> checkOverdue() {
        return ResponseEntity.ok(Map.of("updatedCount", invoiceService.checkAndMarkOverdue()));
    }

    @Operation(summary = "Update invoice: only ISSUED invoices can be edited")
    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(@PathVariable Integer id,
                                                         @Valid @RequestBody InvoiceUpdateRequest request) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, request));
    }

    @Operation(summary = "Delete invoice: removes journal entry and bank operation if needed")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Integer id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}