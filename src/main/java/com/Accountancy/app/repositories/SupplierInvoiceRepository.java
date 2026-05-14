package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.SupplierInvoice;
import com.Accountancy.app.entities.SupplierInvoice.SupplierInvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierInvoiceRepository extends JpaRepository<SupplierInvoice, Integer> {

    @Query("SELECT si FROM SupplierInvoice si WHERE si.supplier.company.id = :companyId")
    List<SupplierInvoice> findAllByCompanyId(@Param("companyId") Integer companyId);

    @Query("SELECT si FROM SupplierInvoice si WHERE si.supplier.id = :supplierId AND si.supplier.company.id = :companyId")
    List<SupplierInvoice> findBySupplierIdAndCompanyId(@Param("supplierId") Integer supplierId,
                                                       @Param("companyId") Integer companyId);

    @Query("""
           SELECT si FROM SupplierInvoice si
           WHERE si.supplier.company.id = :companyId
             AND si.issueDate >= :from AND si.issueDate <= :to
           """)
    List<SupplierInvoice> findByCompanyIdAndIssueDateBetween(@Param("companyId") Integer companyId,
                                                             @Param("from") LocalDate from,
                                                             @Param("to") LocalDate to);

    @Query("SELECT si FROM SupplierInvoice si WHERE si.id = :id AND si.supplier.company.id = :companyId")
    Optional<SupplierInvoice> findByIdAndCompanyId(@Param("id") Integer id,
                                                   @Param("companyId") Integer companyId);

    // Folosit în checkAndMarkOverdue din SupplierService
    @Query("SELECT si FROM SupplierInvoice si WHERE si.status = :status AND si.supplier.company.id = :companyId")
    List<SupplierInvoice> findByStatusAndCompany_Id(@Param("status") SupplierInvoiceStatus status,
                                                    @Param("companyId") Integer companyId);

    List<SupplierInvoice> findBySupplierId(Integer supplierId);
}