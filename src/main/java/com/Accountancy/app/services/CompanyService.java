package com.Accountancy.app.services;

import com.Accountancy.app.dto.CompanyDTO;
import com.Accountancy.app.dto.CompanyDTO.*;
import com.Accountancy.app.entities.Company;
import com.Accountancy.app.repositories.*;
import com.Accountancy.app.entities.User;
import com.Accountancy.app.entities.UserCompany;
import com.Accountancy.app.repositories.CompanyRepository;
import com.Accountancy.app.repositories.UserCompanyRepository;
import com.Accountancy.app.repositories.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final JournalLineRepository journalLineRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ClientRepository clientRepository;
    private final TaxRateRepository taxRateRepository;
    private final BankAccountService bankAccountService;

    public CompanyService(CompanyRepository companyRepository,
                          UserCompanyRepository userCompanyRepository,
                          UserRepository userRepository,
                          InvoiceRepository invoiceRepository,
                          ExpenseRepository expenseRepository,
                          BankTransactionRepository bankTransactionRepository,
                          JournalLineRepository journalLineRepository,
                          JournalEntryRepository journalEntryRepository,
                          BankAccountRepository bankAccountRepository,
                          ClientRepository clientRepository,
                          TaxRateRepository taxRateRepository,
                          BankAccountService bankAccountService) {
        this.companyRepository = companyRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.userRepository = userRepository;
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.bankTransactionRepository = bankTransactionRepository;
        this.journalLineRepository = journalLineRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.clientRepository = clientRepository;
        this.taxRateRepository = taxRateRepository;
        this.bankAccountService = bankAccountService;
    }

    // ============================================================
    // ADMIN — full CRUD on companies
    // ============================================================

    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findByIsActiveTrueOrderByCodeAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CompanyResponse getCompanyById(Integer id) {
        return toResponse(findById(id));
    }

    @Transactional
    public CompanyResponse createCompany(CompanyRequest request) {
        if (companyRepository.existsByCode(request.code())) {
            throw new RuntimeException("Company code already in use: " + request.code());
        }
        if (companyRepository.existsByTaxId(request.taxId())) {
            throw new RuntimeException("Tax ID already in use: " + request.taxId());
        }

        Company company = Company.builder()
                .code(request.code())
                .name(request.name())
                .taxId(request.taxId())
                .tradeRegisterNo(request.tradeRegisterNo())
                .caenCode(request.caenCode())
                .shareCapital(request.shareCapital())
                .addressCounty(request.addressCounty())
                .addressCity(request.addressCity())
                .addressStreet(request.addressStreet())
                .addressNumber(request.addressNumber())
                .addressBlock(request.addressBlock())
                .addressEntrance(request.addressEntrance())
                .addressFloor(request.addressFloor())
                .addressApartment(request.addressApartment())
                .addressSector(request.addressSector())
                .addressPostalCode(request.addressPostalCode())
                .phone(request.phone())
                .email(request.email())
                .primaryBankIban(request.primaryBankIban())
                .primaryBankName(request.primaryBankName())
                .vatPayer(request.vatPayer())
                .vatPeriod(request.vatPeriod())
                .vatOnCollection(request.vatOnCollection())
                .profitTaxType(request.profitTaxType())
                .isActive(true)
                .build();

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        bankAccountService.createBankAccountForCompany(companyRepository.save(company), user);

        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public CompanyResponse updateCompany(Integer id, CompanyRequest request) {
        Company company = findById(id);

        if (!company.getCode().equals(request.code()) &&
                companyRepository.existsByCode(request.code())) {
            throw new RuntimeException("Company code already in use: " + request.code());
        }

        if (!company.getTaxId().equals(request.taxId()) &&
                companyRepository.existsByTaxId(request.taxId())) {
            throw new RuntimeException("Tax ID already in use: " + request.taxId());
        }

        company.setCode(request.code());
        company.setName(request.name());
        company.setTaxId(request.taxId());
        company.setTradeRegisterNo(request.tradeRegisterNo());
        company.setCaenCode(request.caenCode());
        company.setShareCapital(request.shareCapital());
        company.setAddressCounty(request.addressCounty());
        company.setAddressCity(request.addressCity());
        company.setAddressStreet(request.addressStreet());
        company.setAddressNumber(request.addressNumber());
        company.setAddressBlock(request.addressBlock());
        company.setAddressEntrance(request.addressEntrance());
        company.setAddressFloor(request.addressFloor());
        company.setAddressApartment(request.addressApartment());
        company.setAddressSector(request.addressSector());
        company.setAddressPostalCode(request.addressPostalCode());
        company.setPhone(request.phone());
        company.setEmail(request.email());
        company.setPrimaryBankIban(request.primaryBankIban());
        company.setPrimaryBankName(request.primaryBankName());
        company.setVatPayer(request.vatPayer());
        company.setVatPeriod(request.vatPeriod());
        company.setVatOnCollection(request.vatOnCollection());
        company.setProfitTaxType(request.profitTaxType());

        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public void deleteCompany(Integer id) {
        // Nullify circular FKs
        invoiceRepository.nullifyJournalEntries(id);

        // Delete all tenant data
        // NOTE: accounts are now global — not deleted when a company is deleted
        bankTransactionRepository.deleteByCompanyId(id);
        journalLineRepository.deleteByCompanyId(id);
        journalEntryRepository.deleteByCompanyId(id);
        invoiceRepository.deleteByCompanyId(id);
        bankAccountRepository.deleteByCompanyId(id);
        clientRepository.deleteByCompanyId(id);
        taxRateRepository.deleteByCompanyId(id);
        userCompanyRepository.deleteByCompanyId(id);
        companyRepository.deleteById(id);
    }

    public List<CompanyResponse> searchCompanies(String name) {
        return companyRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CompanyDTO.UserCompanyResponse> getCompanyAccess(Integer companyId) {
        return userCompanyRepository.findByCompany_Id(companyId)
                .stream()
                .map(uc -> {
                    User u = userRepository.findById(uc.getUserId()).orElse(null);
                    return new CompanyDTO.UserCompanyResponse(
                            uc.getUserId(),
                            u != null ? u.getName() : null,
                            u != null ? u.getEmail() : null,
                            uc.getIsDefault()
                    );
                })
                .toList();
    }

    // ============================================================
    // Current user — companies they have access to
    // ============================================================

    public List<CompanySummary> getMyCompanies() {
        User currentUser = currentUser();

        if (currentUser.getRole() == User.Role.ADMIN) {
            return companyRepository.findByIsActiveTrueOrderByCodeAsc()
                    .stream()
                    .map(c -> new CompanySummary(c.getId(), c.getCode(), c.getName(), c.getTaxId(), false))
                    .toList();
        }

        return userCompanyRepository.findAccessibleByUserId(currentUser.getId())
                .stream()
                .map(uc -> new CompanySummary(
                        uc.getCompany().getId(), uc.getCompany().getCode(),
                        uc.getCompany().getName(), uc.getCompany().getTaxId(),
                        uc.getIsDefault()))
                .toList();
    }

    // ============================================================
    // ADMIN — granting/revoking user access to a company
    // ============================================================

    @Transactional
    public void grantAccess(CompanyAccessRequest request) {
        if (!userRepository.existsById(request.userId())) {
            throw new RuntimeException("User not found: " + request.userId());
        }
        if (!companyRepository.existsById(request.companyId())) {
            throw new RuntimeException("Company not found: " + request.companyId());
        }
        if (userCompanyRepository.existsByUserIdAndCompany_Id(request.userId(), request.companyId())) {
            throw new RuntimeException("User already has access to this company");
        }

        Company company = findById(request.companyId());
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault());

        if (makeDefault) {
            userCompanyRepository.findFirstByUserIdAndIsDefaultTrue(request.userId())
                    .ifPresent(prev -> {
                        prev.setIsDefault(false);
                        userCompanyRepository.save(prev);
                    });
        }

        UserCompany uc = UserCompany.builder()
                .userId(request.userId())
                .company(company)
                .isDefault(makeDefault)
                .build();

        userCompanyRepository.save(uc);
    }

    @Transactional
    public void revokeAccess(Integer userId, Integer companyId) {
        if (!userCompanyRepository.existsByUserIdAndCompany_Id(userId, companyId)) {
            throw new RuntimeException("Access not found for user " + userId
                    + " on company " + companyId);
        }
        userCompanyRepository.deleteByUserIdAndCompany_Id(userId, companyId);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private Company findById(Integer id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found: " + id));
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email));
    }

    private CompanyResponse toResponse(Company c) {
        return new CompanyResponse(
                c.getId(),
                c.getCode(),
                c.getName(),
                c.getTaxId(),
                c.getTradeRegisterNo(),
                c.getCaenCode(),
                c.getShareCapital(),
                c.getAddressCounty(),
                c.getAddressCity(),
                c.getAddressStreet(),
                c.getAddressNumber(),
                c.getAddressBlock(),
                c.getAddressEntrance(),
                c.getAddressFloor(),
                c.getAddressApartment(),
                c.getAddressSector(),
                c.getAddressPostalCode(),
                c.getPhone(),
                c.getEmail(),
                c.getPrimaryBankIban(),
                c.getPrimaryBankName(),
                c.getVatPayer(),
                c.getVatPeriod(),
                c.getVatOnCollection(),
                c.getProfitTaxType(),
                c.getIsActive(),
                c.getCreatedAt()
        );
    }
}