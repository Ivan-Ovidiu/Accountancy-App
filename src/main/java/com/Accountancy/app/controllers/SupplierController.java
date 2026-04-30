package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.SupplierDTO.*;
import com.Accountancy.app.services.SupplierService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/api/supplier-invoices")
    public ResponseEntity<List<SupplierInvoiceResponse>> getAllSupplierInvoices() {
        return ResponseEntity.ok(supplierService.getAllSupplierInvoices());
    }

    @GetMapping("/api/supplier-invoices/{id}")
    public ResponseEntity<SupplierInvoiceResponse> getSupplierInvoiceById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getSupplierInvoiceById(id));
    }

    @GetMapping("/api/supplier-invoices/supplier/{supplierId}")
    public ResponseEntity<List<SupplierInvoiceResponse>> getInvoicesBySupplier(@PathVariable Integer supplierId) {
        return ResponseEntity.ok(supplierService.getInvoicesBySupplier(supplierId));
    }

    // Inregistreaza factura primita — posteaza automat 6xx + 4426 = 401
    @PostMapping("/api/supplier-invoices")
    public ResponseEntity<SupplierInvoiceResponse> createSupplierInvoice(@RequestBody SupplierInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplierInvoice(request));
    }

    // Plata facturii — posteaza automat 401 = 5121
    @PostMapping("/api/supplier-invoices/{id}/pay")
    public ResponseEntity<SupplierInvoiceResponse> paySupplierInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.paySupplierInvoice(id));
    }

    // Anulare factura
    @PostMapping("/api/supplier-invoices/{id}/void")
    public ResponseEntity<SupplierInvoiceResponse> voidSupplierInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.voidSupplierInvoice(id));
    }
}