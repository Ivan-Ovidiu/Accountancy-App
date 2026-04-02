package com.Accountancy.app.services;

import com.Accountancy.app.dto.BankDTO.BankAccountRequest;
import com.Accountancy.app.dto.BankDTO.BankAccountResponse;
import com.Accountancy.app.entities.Account;
import com.Accountancy.app.entities.BankAccount;
import com.Accountancy.app.entities.User;
import com.Accountancy.app.repositories.AccountRepository;
import com.Accountancy.app.repositories.BankAccountRepository;
import com.Accountancy.app.repositories.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public BankAccountService(BankAccountRepository bankAccountRepository,
                              AccountRepository accountRepository,
                              UserRepository userRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    public List<BankAccountResponse> getAllBankAccounts() {
        return bankAccountRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BankAccountResponse getBankAccountById(Integer id) {
        return toResponse(findById(id));
    }

    public BankAccountResponse createBankAccount(BankAccountRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        BankAccount bankAccount = BankAccount.builder()
                .bankName(request.bankName())
                .accountNumber(request.accountNumber())
                .accountName(request.accountName())
                .currentBalance(request.currentBalance())
                .currency(request.currency() != null ? request.currency() : "RON")
                .isActive(true)
                .user(user)
                .build();

        if (request.accountId() != null) {
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

    public BankAccount findById(Integer id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found: " + id));
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
}