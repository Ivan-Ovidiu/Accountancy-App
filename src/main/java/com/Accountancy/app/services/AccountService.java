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

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AccountResponse> getAccountsByType(AccountType type) {
        return accountRepository.findByTypeAndIsActiveTrue(type)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AccountResponse> getRootAccounts() {
        return accountRepository.findByParentIsNullAndIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AccountResponse> getChildAccounts(Integer parentId) {
        findById(parentId); // verify exists
        return accountRepository.findByParentId(parentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AccountResponse getAccountById(Integer id) {
        return toResponse(findById(id));
    }

    public AccountResponse getAccountByCode(String code) {
        Account account = accountRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Account not found with code: " + code));
        return toResponse(account);
    }

    public AccountResponse createAccount(AccountRequest request) {
        if (accountRepository.existsByCode(request.code())) {
            throw new RuntimeException("Account code already exists: " + request.code());
        }

        Account account = Account.builder()
                .code(request.code())
                .name(request.name())
                .type(request.type())
                .subType(request.subType())
                .isActive(true)
                .build();

        if (request.parentId() != null) {
            Account parent = findById(request.parentId());
            account.setParent(parent);
        }

        return toResponse(accountRepository.save(account));
    }

    public AccountResponse updateAccount(Integer id, AccountRequest request) {
        Account account = findById(id);

        if (!account.getCode().equals(request.code()) &&
                accountRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw new RuntimeException("Account code already exists: " + request.code());
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

    public void deactivateAccount(Integer id) {
        Account account = findById(id);
        account.setIsActive(false);
        accountRepository.save(account);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Account findById(Integer id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found: " + id));
    }

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