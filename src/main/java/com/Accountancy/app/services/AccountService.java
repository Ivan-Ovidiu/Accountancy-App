package com.Accountancy.app.services;

import com.Accountancy.app.dto.AccountDTO.AccountRequest;
import com.Accountancy.app.dto.AccountDTO.AccountResponse;
import com.Accountancy.app.entities.Account;
import com.Accountancy.app.entities.Account.AccountType;
import com.Accountancy.app.repositories.AccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    // GET all active accounts
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET accounts by type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
    public List<AccountResponse> getAccountsByType(AccountType type) {
        return accountRepository.findByType(type)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET only root accounts (no parent — top level of chart of accounts)
    public List<AccountResponse> getRootAccounts() {
        return accountRepository.findByParentIsNull()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET children of a specific account
    public List<AccountResponse> getChildAccounts(Integer parentId) {
        return accountRepository.findByParentId(parentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET single account by id
    public AccountResponse getAccountById(Integer id) {
        Account account = findById(id);
        return toResponse(account);
    }

    // GET single account by code (e.g. "5200")
    public AccountResponse getAccountByCode(String code) {
        Account account = accountRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Account not found with code: " + code));
        return toResponse(account);
    }

    // POST — create new account
    public AccountResponse createAccount(AccountRequest request) {
        // Check code is unique
        if (accountRepository.findByCode(request.code()).isPresent()) {
            throw new RuntimeException("Account code already exists: " + request.code());
        }

        Account account = Account.builder()
                .code(request.code())
                .name(request.name())
                .type(request.type())
                .subType(request.subType())
                .isActive(true)
                .build();

        // Set parent if provided
        if (request.parentId() != null) {
            Account parent = findById(request.parentId());
            account.setParent(parent);
        }

        return toResponse(accountRepository.save(account));
    }

    // PUT — update account
    public AccountResponse updateAccount(Integer id, AccountRequest request) {
        Account account = findById(id);

        // If code changed, check new code is unique
        if (!account.getCode().equals(request.code())) {
            if (accountRepository.findByCode(request.code()).isPresent()) {
                throw new RuntimeException("Account code already exists: " + request.code());
            }
        }

        account.setCode(request.code());
        account.setName(request.name());
        account.setType(request.type());
        account.setSubType(request.subType());

        if (request.parentId() != null) {
            Account parent = findById(request.parentId());
            account.setParent(parent);
        } else {
            account.setParent(null);
        }

        return toResponse(accountRepository.save(account));
    }

    // DELETE — soft delete
    public void deactivateAccount(Integer id) {
        Account account = findById(id);
        account.setIsActive(false);
        accountRepository.save(account);
    }

    // Internal helper
    private Account findById(Integer id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found: " + id));
    }

    // Entity → DTO
    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getCode(),
                account.getName(),
                account.getType(),
                account.getSubType(),
                account.getParent() != null ? account.getParent().getId() : null,
                account.getParent() != null ? account.getParent().getName() : null,
                account.getIsActive()
        );
    }
}