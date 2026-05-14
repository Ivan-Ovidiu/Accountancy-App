package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.SupplierDTO.*;
import com.Accountancy.app.services.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@SecurityRequirement(name = "bearerAuth")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    // ── SUPPLIERS ────────────────────────────────────────────────

    @GetMapping("/api/suppliers")
    public ResponseEntity<List<SupplierResponse>> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/api/suppliers/{id}")
    public ResponseEntity<SupplierResponse> getSupplierById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping("/api/suppliers")
    public ResponseEntity<SupplierResponse> createSupplier(@RequestBody SupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(request));
    }

    @PutMapping("/api/suppliers/{id}")
    public ResponseEntity<SupplierResponse> updateSupplier(@PathVariable Integer id, @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, request));
    }

    @DeleteMapping("/api/suppliers/{id}")
    public ResponseEntity<Void> deactivateSupplier(@PathVariable Integer id) {
        supplierService.deactivateSupplier(id);
        return ResponseEntity.noContent().build();
    }

    // ── SUPPLIER INVOICES ────────────────────────────────────────

    @Operation(summary = "Get all supplier invoices for current company")
    @GetMapping("/api/supplier-invoices")
    public ResponseEntity<List<SupplierInvoiceResponse>> getAllSupplierInvoices() {
        return ResponseEntity.ok(supplierService.getAllSupplierInvoices());
    }

    @Operation(summary = "Get supplier invoice by ID")
    @GetMapping("/api/supplier-invoices/{id}")
    public ResponseEntity<SupplierInvoiceResponse> getSupplierInvoiceById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getSupplierInvoiceById(id));
    }

    @Operation(summary = "Get invoices by supplier")
    @GetMapping("/api/supplier-invoices/supplier/{supplierId}")
    public ResponseEntity<List<SupplierInvoiceResponse>> getInvoicesBySupplier(@PathVariable Integer supplierId) {
        return ResponseEntity.ok(supplierService.getInvoicesBySupplier(supplierId));
    }

    @Operation(summary = "Create supplier invoice with status PENDING — does not post journal entry yet")
    @PostMapping("/api/supplier-invoices")
    public ResponseEntity<SupplierInvoiceResponse> createSupplierInvoice(@RequestBody SupplierInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplierInvoice(request));
    }

    @Operation(summary = "Register invoice: PENDING → REGISTERED. Posts journal entry 6xx+4426=401. Invoice now appears in reports.")
    @PostMapping("/api/supplier-invoices/{id}/register")
    public ResponseEntity<SupplierInvoiceResponse> registerSupplierInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.registerSupplierInvoice(id));
    }

    @Operation(summary = "Pay invoice: REGISTERED / OVERDUE → PAID. Posts journal entry 401=5121.")
    @PostMapping("/api/supplier-invoices/{id}/pay")
    public ResponseEntity<SupplierInvoiceResponse> paySupplierInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.paySupplierInvoice(id));
    }

    @Operation(summary = "Void invoice: PENDING / REGISTERED / OVERDUE → VOID. Cannot void paid invoices.")
    @PostMapping("/api/supplier-invoices/{id}/void")
    public ResponseEntity<SupplierInvoiceResponse> voidSupplierInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.voidSupplierInvoice(id));
    }

    @Operation(summary = "Check and mark overdue: sets OVERDUE on REGISTERED invoices past due date.")
    @PostMapping("/api/supplier-invoices/check-overdue")
    public ResponseEntity<Map<String, Integer>> checkOverdue() {
        int updated = supplierService.checkAndMarkOverdue();
        return ResponseEntity.ok(Map.of("updatedCount", updated));
    }

    @Operation(summary = "Delete supplier invoice: removes bank operation (if PAID), journal entries, and invoice")
    @DeleteMapping("/api/supplier-invoices/{id}")
    public ResponseEntity<Void> deleteSupplierInvoice(@PathVariable Integer id) {
        supplierService.deleteSupplierInvoice(id);
        return ResponseEntity.noContent().build();
    }
    @Operation(summary = "Update supplier invoice: only PENDING invoices can be edited")
    @PutMapping("/api/supplier-invoices/{id}")
    public ResponseEntity<SupplierInvoiceResponse> updateSupplierInvoice(@PathVariable Integer id,
                                                                         @RequestBody SupplierInvoiceRequest request) {
        return ResponseEntity.ok(supplierService.updateSupplierInvoice(id, request));
    }
}