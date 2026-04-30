package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.SupplierInvoice;
import com.Accountancy.app.entities.SupplierInvoice.SupplierInvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SupplierInvoiceRepository extends JpaRepository<SupplierInvoice, Integer> {
    List<SupplierInvoice> findBySupplierId(Integer supplierId);
    List<SupplierInvoice> findByStatus(SupplierInvoiceStatus status);
    List<SupplierInvoice> findByDueDateBeforeAndStatusNot(LocalDate date, SupplierInvoiceStatus status);
}