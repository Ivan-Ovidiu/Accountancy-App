package com.Accountancy.app.services;

import com.Accountancy.app.dto.BankDTO.BankAccountRequest;
import com.Accountancy.app.dto.BankDTO.BankAccountResponse;
import com.Accountancy.app.entities.Account;
import com.Accountancy.app.entities.BankAccount;
import com.Accountancy.app.entities.Company;
import com.Accountancy.app.entities.User;
import com.Accountancy.app.repositories.AccountRepository;
import com.Accountancy.app.repositories.BankAccountRepository;
import com.Accountancy.app.repositories.CompanyRepository;
import com.Accountancy.app.repositories.UserRepository;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyContext companyContext;

    public BankAccountService(BankAccountRepository bankAccountRepository,
                              AccountRepository accountRepository,
                              UserRepository userRepository,
                              CompanyRepository companyRepository,
                              CompanyContext companyContext) {
        this.bankAccountRepository = bankAccountRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.companyContext = companyContext;
    }

    public List<BankAccountResponse> getAllBankAccounts() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return bankAccountRepository.findByIsActiveTrueAndCompany_Id(companyId)
                .stream().map(this::toResponse).toList();
    }

    public BankAccountResponse getBankAccountById(Integer id) {
        return toResponse(findById(id));
    }

    public BankAccountResponse createBankAccount(BankAccountRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = findCompany(companyId);

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        BankAccount bankAccount = BankAccount.builder()
                .bankName(request.bankName())
                .accountNumber(request.accountNumber())
                .accountName(request.accountName())
                .currentBalance(request.currentBalance())
                .currency(request.currency() != null ? request.currency() : "RON")
                .company(company)
                .isActive(true)
                .user(user)
                .build();

        if (request.accountId() != null) {
            // Chart-of-accounts entry must belong to same company
            Account account = accountRepository.findById(request.accountId())
                    .orElseThrow(() -> new RuntimeException("Account not found: " + request.accountId()));
            bankAccount.setAccount(account);
        }

        return toResponse(bankAccountRepository.save(bankAccount));
    }

    public void deactivateBankAccount(Integer id) {
        BankAccount bankAccount = findById(id);
        bankAccount.setIsActive(false);
        bankAccountRepository.save(bankAccount);
    }

    /**
     * Used internally by BankReconciliationService. Validates company ownership.
     */
    public BankAccount findById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return bankAccountRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new RuntimeException("Bank account not found: " + id));
    }

    private Company findCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
    }

    private BankAccountResponse toResponse(BankAccount b) {
        return new BankAccountResponse(
                b.getId(),
                b.getBankName(),
                b.getAccountNumber(),
                b.getAccountName(),
                b.getCurrentBalance(),
                b.getCurrency(),
                b.getAccount() != null ? b.getAccount().getId() : null,
                b.getAccount() != null ? b.getAccount().getName() : null,
                b.getIsActive(),
                b.getCreatedAt()
        );
    }
    public BankAccount createBankAccountForCompany(Company company, User user) {
        if (company.getPrimaryBankIban() == null || company.getPrimaryBankIban().isBlank()) return null;

        BankAccount bankAccount = BankAccount.builder()
                .bankName(company.getPrimaryBankName() != null ? company.getPrimaryBankName() : "Bancă principală")
                .accountNumber(company.getPrimaryBankIban())
                .accountName("Cont principal " + company.getName())
                .currentBalance(java.math.BigDecimal.ZERO)
                .currency("RON")
                .company(company)
                .isActive(true)
                .user(user)
                .build();

        return bankAccountRepository.save(bankAccount);
    }
}