package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.InvoiceDTO.InvoiceRequest;
import com.Accountancy.app.dto.InvoiceDTO.InvoiceResponse;
import com.Accountancy.app.entities.Invoice.InvoiceStatus;
import com.Accountancy.app.services.InvoiceService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@SecurityRequirement(name = "bearerAuth")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    // GET /api/invoices
    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    // GET /api/invoices/{id}
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    // GET /api/invoices/client/{clientId}
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByClient(@PathVariable Integer clientId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByClient(clientId));
    }

    // GET /api/invoices/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByStatus(@PathVariable InvoiceStatus status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    // GET /api/invoices/overdue
    @GetMapping("/overdue")
    public ResponseEntity<List<InvoiceResponse>> getOverdueInvoices() {
        return ResponseEntity.ok(invoiceService.getOverdueInvoices());
    }

    // POST /api/invoices  — creates invoice as DRAFT
    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.createInvoice(request));
    }

    // POST /api/invoices/{id}/send  — DRAFT → SENT + posts journal entry
    @PostMapping("/{id}/send")
    public ResponseEntity<InvoiceResponse> sendInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.sendInvoice(id));
    }

    // POST /api/invoices/{id}/pay  — SENT → PAID
    @PostMapping("/{id}/pay")
    public ResponseEntity<InvoiceResponse> markAsPaid(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.markAsPaid(id));
    }

    // POST /api/invoices/{id}/void  — voids the invoice
    @PostMapping("/{id}/void")
    public ResponseEntity<InvoiceResponse> voidInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.voidInvoice(id));
    }
}